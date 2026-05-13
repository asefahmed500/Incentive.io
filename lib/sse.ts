/**
 * Server-Sent Events (SSE) utility for real-time updates
 */

export interface SSEClient {
  id: string
  userId: string
  role: string
  controller: ReadableStreamDefaultController
}

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map()

  addClient(client: SSEClient) {
    const userId = client.userId
    if (!this.clients.has(userId)) {
      this.clients.set(userId, [])
    }
    this.clients.get(userId)!.push(client)
  }

  removeClient(clientId: string, userId: string) {
    const userClients = this.clients.get(userId)
    if (userClients) {
      const index = userClients.findIndex(c => c.id === clientId)
      if (index !== -1) {
        userClients.splice(index, 1)
      }
      if (userClients.length === 0) {
        this.clients.delete(userId)
      }
    }
  }

  sendToUser(userId: string, data: { type: string; payload: unknown }) {
    const userClients = this.clients.get(userId)
    if (userClients) {
      const message = `data: ${JSON.stringify(data)}\n\n`
      userClients.forEach(client => {
        try {
          client.controller.enqueue(new TextEncoder().encode(message))
        } catch (error) {
          console.error("Failed to send SSE message:", error)
          this.removeClient(client.id, userId)
        }
      })
    }
  }

  sendToRole(role: string, data: { type: string; payload: unknown }) {
    this.clients.forEach(userClients => {
      userClients.forEach(client => {
        if (client.role === role) {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`
            client.controller.enqueue(new TextEncoder().encode(message))
          } catch (error) {
            console.error("Failed to send SSE message:", error)
            this.removeClient(client.id, client.userId)
          }
        }
      })
    })
  }

  broadcast(data: { type: string; payload: unknown }) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    this.clients.forEach(userClients => {
      userClients.forEach(client => {
        try {
          client.controller.enqueue(new TextEncoder().encode(message))
        } catch (error) {
          console.error("Failed to send SSE message:", error)
          this.removeClient(client.id, client.userId)
        }
      })
    })
  }

  getUserClientCount(userId: string): number {
    return this.clients.get(userId)?.length || 0
  }

  getTotalClientCount(): number {
    let total = 0
    this.clients.forEach(clients => {
      total += clients.length
    })
    return total
  }
}

export const sseManager = new SSEManager()

// Event types
export const SSE_EVENTS = {
  NOTIFICATION_NEW: "notification.new",
  NOTIFICATION_READ: "notification.read",
  SALE_CREATED: "sale.created",
  SALE_UPDATED: "sale.updated",
  SALE_APPROVED: "sale.approved",
  SALE_REJECTED: "sale.rejected",
  COMMISSION_CALCULATED: "commission.calculated",
  WALLET_UPDATED: "wallet.updated",
  DASHBOARD_REFRESH: "dashboard.refresh",
} as const
