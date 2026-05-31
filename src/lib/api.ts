'use client'

const API_BASE = '/api'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong')
    }

    return data
  }

  // Auth
  async register(data: { firstName: string; lastName: string; email: string; phone: string; username: string; password: string; role?: string }) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) })
  }

  async login(data: { username: string; password: string }) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) })
  }

  async verifyOtp(data: { userId: string; otpCode: string }) {
    return this.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) })
  }

  async resendOtp(data: { userId: string }) {
    return this.request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) })
  }

  async getMe() {
    return this.request('/auth/me')
  }

  async createOwner(data: { firstName: string; lastName: string; email: string; phone: string; username: string; password: string }) {
    return this.request('/auth/create-owner', { method: 'POST', body: JSON.stringify(data) })
  }

  // Halls
  async getHalls(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/halls?${searchParams.toString()}`)
  }

  async getHall(hallId: string) {
    return this.request(`/halls/${hallId}`)
  }

  async createHall(data: Record<string, unknown>) {
    return this.request('/halls', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateHall(hallId: string, data: Record<string, unknown>) {
    return this.request(`/halls/${hallId}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteHall(hallId: string) {
    return this.request(`/halls/${hallId}`, { method: 'DELETE' })
  }

  async getMyHalls() {
    return this.request('/halls/my-halls')
  }

  async approveHall(hallId: string) {
    return this.request(`/halls/${hallId}/approve`, { method: 'PUT' })
  }

  // Hall sub-resources
  async addHallImage(hallId: string, imageUrl: string) {
    return this.request(`/halls/${hallId}/images`, { method: 'POST', body: JSON.stringify({ imageUrl }) })
  }

  async deleteHallImage(hallId: string, imageId: string) {
    return this.request(`/halls/${hallId}/images`, { method: 'DELETE', body: JSON.stringify({ imageId }) })
  }

  async addSinger(hallId: string, data: { singerName: string; price: number; imageUrl?: string }) {
    return this.request(`/halls/${hallId}/singers`, { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteSinger(hallId: string, singerId: string) {
    return this.request(`/halls/${hallId}/singers`, { method: 'DELETE', body: JSON.stringify({ singerId }) })
  }

  async addMenu(hallId: string, menuName: string) {
    return this.request(`/halls/${hallId}/menus`, { method: 'POST', body: JSON.stringify({ menuName }) })
  }

  async deleteMenu(hallId: string, menuId: string) {
    return this.request(`/halls/${hallId}/menus`, { method: 'DELETE', body: JSON.stringify({ menuId }) })
  }

  async addCar(hallId: string, data: { brand: string; price: number; imageUrl?: string }) {
    return this.request(`/halls/${hallId}/cars`, { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteCar(hallId: string, carId: string) {
    return this.request(`/halls/${hallId}/cars`, { method: 'DELETE', body: JSON.stringify({ carId }) })
  }

  // Calendar
  async getHallCalendar(hallId: string, month: number, year: number) {
    return this.request(`/halls/${hallId}/calendar?month=${month}&year=${year}`)
  }

  // Bookings
  async getBookings(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/bookings?${searchParams.toString()}`)
  }

  async getBooking(bookingId: string) {
    return this.request(`/bookings/${bookingId}`)
  }

  async createBooking(data: Record<string, unknown>) {
    return this.request('/bookings', { method: 'POST', body: JSON.stringify(data) })
  }

  async cancelBooking(bookingId: string) {
    return this.request(`/bookings/${bookingId}`, { method: 'DELETE' })
  }

  async getMyBookings(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/bookings/my-bookings?${searchParams.toString()}`)
  }

  // Admin
  async getAdminDashboard() {
    return this.request('/admin/dashboard')
  }

  async getAdminHalls(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/admin/halls?${searchParams.toString()}`)
  }

  async getAdminOwners(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/admin/owners?${searchParams.toString()}`)
  }

  async getAdminBookings(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value))
        }
      })
    }
    return this.request(`/admin/bookings?${searchParams.toString()}`)
  }

  async seedData() {
    return this.request('/admin/seed', { method: 'POST' })
  }
}

export const api = new ApiClient()
