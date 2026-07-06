export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      box: {
        Row: {
          bestBefore: string | null
          category: string | null
          createdAt: string
          description: string | null
          id: string
          items: string[]
          originalPrice: number
          photoUrl: string | null
          pickupEnd: string
          pickupStart: string
          price: number
          status: Database["public"]["Enums"]["box_status"]
          stockQty: number
          storeId: string
          title: string
        }
        Insert: {
          bestBefore?: string | null
          category?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          items?: string[]
          originalPrice: number
          photoUrl?: string | null
          pickupEnd: string
          pickupStart: string
          price: number
          status?: Database["public"]["Enums"]["box_status"]
          stockQty: number
          storeId: string
          title: string
        }
        Update: {
          bestBefore?: string | null
          category?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          items?: string[]
          originalPrice?: number
          photoUrl?: string | null
          pickupEnd?: string
          pickupStart?: string
          price?: number
          status?: Database["public"]["Enums"]["box_status"]
          stockQty?: number
          storeId?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_storeId_fkey"
            columns: ["storeId"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          createdAt: string
          fullName: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          createdAt?: string
          fullName?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          createdAt?: string
          fullName?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reservation: {
        Row: {
          amount: number
          boxId: string
          code: string
          customerId: string
          expiresAt: string
          id: string
          paymentMethod: Database["public"]["Enums"]["payment_method"]
          pickedUpAt: string | null
          reservedAt: string
          status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          amount: number
          boxId: string
          code: string
          customerId: string
          expiresAt: string
          id?: string
          paymentMethod: Database["public"]["Enums"]["payment_method"]
          pickedUpAt?: string | null
          reservedAt?: string
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          amount?: number
          boxId?: string
          code?: string
          customerId?: string
          expiresAt?: string
          id?: string
          paymentMethod?: Database["public"]["Enums"]["payment_method"]
          pickedUpAt?: string | null
          reservedAt?: string
          status?: Database["public"]["Enums"]["reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reservation_boxId_fkey"
            columns: ["boxId"]
            isOneToOne: false
            referencedRelation: "box"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          comment: string | null
          createdAt: string
          customerId: string
          id: string
          rating: number
          reservationId: string
          storeId: string
        }
        Insert: {
          comment?: string | null
          createdAt?: string
          customerId: string
          id?: string
          rating: number
          reservationId: string
          storeId: string
        }
        Update: {
          comment?: string | null
          createdAt?: string
          customerId?: string
          id?: string
          rating?: number
          reservationId?: string
          storeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: true
            referencedRelation: "reservation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_storeId_fkey"
            columns: ["storeId"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      store: {
        Row: {
          address: string
          createdAt: string
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string | null
          ownerId: string
          photoUrl: string | null
          pickupInfo: string | null
        }
        Insert: {
          address: string
          createdAt?: string
          id?: string
          lat: number
          lng: number
          name: string
          neighborhood?: string | null
          ownerId: string
          photoUrl?: string | null
          pickupInfo?: string | null
        }
        Update: {
          address?: string
          createdAt?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string | null
          ownerId?: string
          photoUrl?: string | null
          pickupInfo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_box: {
        Args: {
          p_box_id: string
          p_customer_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Database["public"]["Tables"]["reservation"]["Row"]
      }
      expire_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      list_boxes_near: {
        Args: {
          p_lat: number
          p_lng: number
        }
        Returns: {
          id: string
          storeId: string
          title: string
          price: number
          originalPrice: number
          stockQty: number
          photoUrl: string | null
          bestBefore: string | null
          pickupEnd: string
          storeName: string
          neighborhood: string | null
          lat: number
          lng: number
          distanceKm: number
          storeRating: number
        }[]
      }
    }
    Enums: {
      box_status: "active" | "soldOut" | "expired"
      payment_method: "cashOnPickup" | "cardMock"
      reservation_status: "reserved" | "paid" | "pickedUp" | "expired" | "cancelled"
      user_role: "customer" | "merchant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
