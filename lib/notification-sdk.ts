import { getGraphQLUrl } from "./api-host";

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  color: string | null;
  actionLink: string | null;
  read: boolean;
  createdAt: string;
  notificationCode?: string;
}

export interface NotificationsResponse {
  items: InAppNotification[];
  total: number;
  page: number;
  size: number;
}

export class ASTCNotificationSDK {
  private port: number;
  private category: string;
  private unreadCache: { count: number; timestamp: number } | null = null;
  private unreadPromise: Promise<number> | null = null;
  private readonly CACHE_TTL = 60000;
  private tokenOverride: string | null = null;

  constructor(port: number, category: string) {
    this.port = port;
    this.category = category;
  }

  private get endpointUrl(): string {
    return getGraphQLUrl();
  }

  setToken(token: string) {
    this.tokenOverride = token;
  }

  private getAuthToken(): string {
    if (this.tokenOverride) return this.tokenOverride;
    if (typeof window === "undefined") return "";
    return localStorage.getItem("auth_token") || "";
  }

  private async graphqlRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(this.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error("Error de conexión con el servidor");
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0]?.message || "Error de GraphQL");
    }

    return result.data;
  }

  async getNotifications(userId: string, page = 1, size = 10, category?: string): Promise<NotificationsResponse> {
    const cat = category !== undefined ? category : this.category;
    if (!cat) {
      const query = `
        query getallnotifications($userId: String!, $page: Int!, $size: Int!) {
          getallnotifications(userId: $userId, page: $page, size: $size) {
            page
            size
            total
            items {
              id
              notificationCode
              title
              body
              icon
              color
              actionLink
              read
              createdAt
            }
          }
        }
      `;
      const data = await this.graphqlRequest<any>(query, { userId, page, size });
      return data.getallnotifications || { items: [], total: 0, page, size };
    }

    const query = `
      query getNotificationsByCategory($userId: String!, $category: String!, $page: Int!, $size: Int!) {
        getNotificationsByCategory(userId: $userId, category: $category, page: $page, size: $size) {
          page
          size
          total
          items {
            id
            notificationCode
            title
            body
            icon
            color
            actionLink
            read
            createdAt
          }
        }
      }
    `;
    const data = await this.graphqlRequest<any>(query, { userId, category: cat, page, size });
    const notifications = data.getNotificationsByCategory || { items: [], total: 0, page, size };
    return notifications;
  }

  async getUnreadCount(userId: string, category?: string): Promise<number> {
    const now = Date.now();
    if (this.unreadCache && (now - this.unreadCache.timestamp) < this.CACHE_TTL && !category) {
      return this.unreadCache.count;
    }

    if (!category && this.unreadPromise) {
      return this.unreadPromise;
    }

    const fetchPromise = (async () => {
      try {
        const cat = category !== undefined ? category : this.category;
        const query = `
          query getUnreadCount($userId: String!, $category: String) {
            getUnreadCount(userId: $userId, category: $category)
          }
        `;
        const data = await this.graphqlRequest<any>(query, { userId, category: cat ? cat : null });
        const count = data.getUnreadCount || 0;

        if (!category) {
          this.unreadCache = { count, timestamp: Date.now() };
        }
        return count;
      } finally {
        if (!category) {
          this.unreadPromise = null;
        }
      }
    })();

    if (!category) {
      this.unreadPromise = fetchPromise;
    }

    return fetchPromise;
  }

  invalidateUnreadCache() {
    this.unreadCache = null;
  }

  async markAsRead(userId: string, notificationId: string): Promise<InAppNotification> {
    const query = `
      mutation readNotification($notificationId: String!, $userId: String!) {
        readNotification(notificationId: $notificationId, userId: $userId) {
          id
          title
          body
          icon
          color
          actionLink
          read
          createdAt
        }
      }
    `;
    const data = await this.graphqlRequest<any>(query, { notificationId, userId });
    this.invalidateUnreadCache();
    return data.readNotification;
  }

  async markAllAsRead(userIds: string | string[], notificationIds?: string[]): Promise<void> {
    const userId = Array.isArray(userIds) ? userIds[0] : userIds;
    if (!userId) return;

    try {
      const query = `
        mutation markAllNotificationsAsRead($userId: String!) {
          markAllNotificationsAsRead(userId: $userId)
        }
      `;
      await this.graphqlRequest<any>(query, { userId });
    } catch (err) {
      console.warn("Direct markAllNotificationsAsRead failed, falling back to batch readNotification:", err);
      if (notificationIds && notificationIds.length > 0) {
        const BATCH_SIZE = 10;
        for (let i = 0; i < notificationIds.length; i += BATCH_SIZE) {
          const batch = notificationIds.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(
            batch.map((nid) =>
              this.graphqlRequest<any>(
                `mutation readNotification($notificationId: String!, $userId: String!) {
                   readNotification(notificationId: $notificationId, userId: $userId) { id read }
                 }`,
                { notificationId: nid, userId }
              )
            )
          );
        }
      }
    }
    this.invalidateUnreadCache();
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const query = `
      mutation deleteNotification($notificationId: String!, $userId: String!) {
        deleteNotification(notificationId: $notificationId, userId: $userId)
      }
    `;
    const data = await this.graphqlRequest<any>(query, { notificationId, userId });
    this.invalidateUnreadCache();
    return data.deleteNotification === true;
  }
}
