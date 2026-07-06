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
          tipo: Database["public"]["Enums"]["box_tipo"]
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
          tipo?: Database["public"]["Enums"]["box_tipo"]
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
          tipo?: Database["public"]["Enums"]["box_tipo"]
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
      product: {
        Row: {
          brand: string | null
          category: string | null
          cost: number | null
          createdAt: string
          id: string
          name: string
          photoUrl: string | null
          price: number
          storeId: string
          subcategory: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost?: number | null
          createdAt?: string
          id?: string
          name: string
          photoUrl?: string | null
          price: number
          storeId: string
          subcategory?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost?: number | null
          createdAt?: string
          id?: string
          name?: string
          photoUrl?: string | null
          price?: number
          storeId?: string
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_storeId_fkey"
            columns: ["storeId"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      lot: {
        Row: {
          createdAt: string
          expiryDate: string
          id: string
          price: number
          productId: string
          qty: number
          receivedAt: string
          storeId: string
          unitCost: number
        }
        Insert: {
          createdAt?: string
          expiryDate: string
          id?: string
          price?: number
          productId: string
          qty?: number
          receivedAt?: string
          storeId: string
          unitCost?: number
        }
        Update: {
          createdAt?: string
          expiryDate?: string
          id?: string
          price?: number
          productId?: string
          qty?: number
          receivedAt?: string
          storeId?: string
          unitCost?: number
        }
        Relationships: [
          {
            foreignKeyName: "lot_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_storeId_fkey"
            columns: ["storeId"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase: {
        Row: {
          code: string
          createdAt: string
          customerId: string
          id: string
          paymentMethod: Database["public"]["Enums"]["payment_method"]
          status: string
          storeId: string
          total: number
        }
        Insert: {
          code: string
          createdAt?: string
          customerId: string
          id?: string
          paymentMethod: Database["public"]["Enums"]["payment_method"]
          status?: string
          storeId: string
          total?: number
        }
        Update: {
          code?: string
          createdAt?: string
          customerId?: string
          id?: string
          paymentMethod?: Database["public"]["Enums"]["payment_method"]
          status?: string
          storeId?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_storeId_fkey"
            columns: ["storeId"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_item: {
        Row: {
          id: string
          price: number
          productId: string
          purchaseId: string
          qty: number
        }
        Insert: {
          id?: string
          price: number
          productId: string
          purchaseId: string
          qty: number
        }
        Update: {
          id?: string
          price?: number
          productId?: string
          purchaseId?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_item_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_purchaseId_fkey"
            columns: ["purchaseId"]
            isOneToOne: false
            referencedRelation: "purchase"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi: {
        Row: {
          gananciaTotal: number
          id: string
          nClientes: number
          nPedidos: number
          storeId: string | null
          ventasTotal: number
        }
        Insert: {
          gananciaTotal?: number
          id?: string
          nClientes?: number
          nPedidos?: number
          storeId?: string | null
          ventasTotal?: number
        }
        Update: {
          gananciaTotal?: number
          id?: string
          nClientes?: number
          nPedidos?: number
          storeId?: string | null
          ventasTotal?: number
        }
        Relationships: []
      }
      category_sales: {
        Row: {
          category: string
          id: string
          profit: number
          qty: number
          sales: number
          storeId: string | null
        }
        Insert: {
          category: string
          id?: string
          profit?: number
          qty?: number
          sales?: number
          storeId?: string | null
        }
        Update: {
          category?: string
          id?: string
          profit?: number
          qty?: number
          sales?: number
          storeId?: string | null
        }
        Relationships: []
      }
      monthly_sales: {
        Row: {
          id: string
          month: string
          profit: number
          sales: number
          storeId: string | null
        }
        Insert: {
          id?: string
          month: string
          profit?: number
          sales?: number
          storeId?: string | null
        }
        Update: {
          id?: string
          month?: string
          profit?: number
          sales?: number
          storeId?: string | null
        }
        Relationships: []
      }
      top_product: {
        Row: {
          brand: string | null
          id: string
          name: string
          profit: number
          qty: number
          rank: number
          sales: number
          storeId: string | null
        }
        Insert: {
          brand?: string | null
          id?: string
          name: string
          profit?: number
          qty?: number
          rank: number
          sales?: number
          storeId?: string | null
        }
        Update: {
          brand?: string | null
          id?: string
          name?: string
          profit?: number
          qty?: number
          rank?: number
          sales?: number
          storeId?: string | null
        }
        Relationships: []
      }
      basket_rule: {
        Row: {
          a: string
          b: string
          catA: string | null
          catB: string | null
          confAB: number
          confBA: number
          freq: number
          id: string
          lift: number
          storeId: string | null
        }
        Insert: {
          a: string
          b: string
          catA?: string | null
          catB?: string | null
          confAB?: number
          confBA?: number
          freq?: number
          id?: string
          lift?: number
          storeId?: string | null
        }
        Update: {
          a?: string
          b?: string
          catA?: string | null
          catB?: string | null
          confAB?: number
          confBA?: number
          freq?: number
          id?: string
          lift?: number
          storeId?: string | null
        }
        Relationships: []
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
          tipo: Database["public"]["Enums"]["box_tipo"]
          items: string[]
          storeName: string
          neighborhood: string | null
          lat: number
          lng: number
          distanceKm: number
          storeRating: number
        }[]
      }
      lots_with_level: {
        Args: {
          p_store?: string | null
        }
        Returns: {
          id: string
          storeId: string
          productId: string
          productName: string
          brand: string | null
          category: string | null
          subcategory: string | null
          receivedAt: string
          expiryDate: string
          daysToExpiry: number
          qty: number
          unitCost: number
          price: number
          totalValue: number
          level: string
          autoDiscountPct: number
          rescatPrice: number
        }[]
      }
      inventory_kpis: {
        Args: {
          p_store?: string | null
        }
        Returns: {
          valorTotal: number
          nLotes: number
          criticos: number
          enAlerta: number
          advertencia: number
          ok: number
          valorRiesgo7d: number
          valorRiesgo30d: number
          qtyRiesgo30d: number
        }[]
      }
      create_order: {
        Args: {
          p_items: Json
          p_payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Json
      }
    }
    Enums: {
      box_status: "active" | "soldOut" | "expired"
      box_tipo: "solo" | "duo" | "familia"
      payment_method: "cashOnPickup" | "cardMock"
      reservation_status: "reserved" | "paid" | "pickedUp" | "expired" | "cancelled"
      user_role: "customer" | "merchant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
