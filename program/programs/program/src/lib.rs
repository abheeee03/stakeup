use anchor_lang::prelude::*;

declare_id!("ty9XbRpMZXmqQaR4ZuH6RRmdg9y8xhWymBeHKs6zrnK");

#[program]
pub mod stakeup {
    use super::*;

    // Initialize a pool for a challenge
    pub fn initialize_pool(ctx: Context<InitializePool>, bump: u8) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.bump = bump;
        pool.authority = ctx.accounts.authority.key();
        pool.total_stake = 0;
        Ok(())
    }

    // Deposit SOL into the pool
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Transfer SOL from user to pool PDA
        let user_info = &mut ctx.accounts.user.to_account_info();
        let pool_info = &mut pool.to_account_info();
        **user_info.try_borrow_mut_lamports()? -= amount;
        **pool_info.try_borrow_mut_lamports()? += amount;

        pool.total_stake += amount;

        let user_stake = &mut ctx.accounts.user_stake;
        user_stake.user = ctx.accounts.user.key();
        user_stake.amount += amount;
        // Fix: Use ctx.bumps["user_stake"] instead of get()
        user_stake.bump = ctx.bumps.user_stake; // store PDA bump

        Ok(())
    }

    // Withdraw SOL
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;

        require!(user_stake.amount >= amount, CustomError::InsufficientStake);

        pool.total_stake -= amount;
        user_stake.amount -= amount;

        let pool_info = &mut pool.to_account_info();
        let user_info = &mut ctx.accounts.user.to_account_info();
        **pool_info.try_borrow_mut_lamports()? -= amount;
        **user_info.try_borrow_mut_lamports()? += amount;

        Ok(())
    }

    // Distribute SOL to winner
    pub fn distribute_reward(ctx: Context<DistributeReward>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.total_stake >= amount, CustomError::NotEnoughInPool);

        pool.total_stake -= amount;

        let pool_info = &mut pool.to_account_info();
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += amount;
        **pool_info.try_borrow_mut_lamports()? -= amount;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"pool", authority.key().as_ref()],
        bump,
        space = 8 + 32 + 8 + 1
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump,
        space = 8 + 32 + 8 + 1
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(mut, has_one = user)]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeReward<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, Pool>,

    /// CHECK: Winner can be any wallet
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub total_stake: u64,
    pub bump: u8,
}

#[account]
pub struct UserStake {
    pub user: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient stake to withdraw")]
    InsufficientStake,
    #[msg("Not enough SOL in pool")]
    NotEnoughInPool,
}
