"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Textarea } from "@heroui/input"
import { addToast } from "@heroui/toast"
// Removed custom DatePicker

function CreateChallenge() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: '',
    description: '',
    stake_amount: '',
    duration_days: '7',
    start_date: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // For native date input
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setForm(prev => ({ ...prev, start_date: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!form.title || !form.stake_amount || !form.duration_days || !form.start_date) {
      addToast({ title: "All required fields must be filled", description: "Title, stake, duration, and start date are required." })
      setLoading(false)
      return
    }
    if (isNaN(Number(form.stake_amount)) || Number(form.stake_amount) <= 0) {
      addToast({ title: "Invalid Stake", description: "Stake amount must be a positive number." })
      setLoading(false)
      return
    }
    if (isNaN(Number(form.duration_days)) || Number(form.duration_days) < 1) {
      addToast({ title: "Invalid Duration", description: "Duration must be at least 1 day." })
      setLoading(false)
      return
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user?.id) {
      addToast({ title: "Must Be Signed In", description: "Connect your wallet/sign in before creating a challenge." })
      setLoading(false)
      return
    }

    // Insert challenge
    const { data, error } = await supabase
      .from("challenges")
      .insert([
        {
          creator_id: user.id,
          title: form.title,
          description: form.description,
          stake_amount: Number(form.stake_amount),
          duration_days: Number(form.duration_days),
          start_date: form.start_date,
        }
      ])
      .select('id')
      .single()

    if (error) {
      console.log(error);
      addToast({ title: "Challenge Creation Failed", description: error.message })
      setLoading(false)
      return
    }

    addToast({ title: "Challenge Created!", description: "Redirecting..." })
    router.push(`/challenge/${data.id}`)
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg shadow bg-white">
      <h1 className="text-2xl font-bold mb-6">Create Challenge</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          placeholder="E.g. Walk 10,000 steps"
        />
        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your challenge (optional)"
        />
        <Input
          label="Stake Amount"
          type="number"
          name="stake_amount"
          required
          value={form.stake_amount}
          onChange={handleChange}
          min={0.01}
          step="any"
          placeholder="10"
        />
        <Input
          label="Duration (days)"
          type="number"
          name="duration_days"
          required
          value={form.duration_days}
          onChange={handleChange}
          min={1}
          step={1}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="start_date">
            Start Date<span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={form.start_date}
            onChange={handleDateInputChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Challenge"}
        </Button>
      </form>
    </div>
  )
}

export default CreateChallenge