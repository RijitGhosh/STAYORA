"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"

const AMENITY_OPTIONS = [
  "Free WiFi", "Free Parking", "Breakfast Included", "Swimming Pool",
  "Fitness Centre", "Restaurant", "Spa", "Business Centre",
]

const TYPE_OPTIONS = [
  { value: "LUXURY", label: "Luxury" },
  { value: "BUSINESS", label: "Business" },
  { value: "RESORT", label: "Resort" },
  { value: "HERITAGE", label: "Heritage" },
  { value: "BUDGET", label: "Budget" },
]

export default function SearchFilters() {
  const router = useRouter()
  const sp = useSearchParams()

  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "")
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "")
  const [stars, setStars] = useState<number[]>(
    (sp.get("stars") ?? "").split(",").filter(Boolean).map(Number)
  )
  const [amenities, setAmenities] = useState<string[]>(
    (sp.get("amenities") ?? "").split(",").filter(Boolean)
  )
  const [type, setType] = useState(sp.get("type") ?? "")
  const [rating, setRating] = useState(sp.get("rating") ?? "")
  const [sort, setSort] = useState(sp.get("sort") ?? "recommended")

  useEffect(() => {
    setMinPrice(sp.get("minPrice") ?? "")
    setMaxPrice(sp.get("maxPrice") ?? "")
    setStars((sp.get("stars") ?? "").split(",").filter(Boolean).map(Number))
    setAmenities((sp.get("amenities") ?? "").split(",").filter(Boolean))
    setType(sp.get("type") ?? "")
    setRating(sp.get("rating") ?? "")
    setSort(sp.get("sort") ?? "recommended")
  }, [sp])

  function apply(overrides: Record<string, string | undefined> = {}) {
    const qs = new URLSearchParams(sp.toString())
    qs.delete("page")

    const set = (k: string, v: string | undefined) => {
      if (v === undefined || v === "") qs.delete(k)
      else qs.set(k, v)
    }

    set("minPrice", overrides.minPrice ?? minPrice)
    set("maxPrice", overrides.maxPrice ?? maxPrice)
    set("stars", overrides.stars ?? (stars.length ? stars.join(",") : undefined))
    set("amenities", overrides.amenities ?? (amenities.length ? amenities.join(",") : undefined))
    set("type", overrides.type ?? type)
    set("rating", overrides.rating ?? rating)
    set("sort", overrides.sort ?? sort)

    router.push(`/search?${qs.toString()}`)
  }

  function toggleStar(n: number) {
    const next = stars.includes(n) ? stars.filter((s) => s !== n) : [...stars, n]
    setStars(next)
    apply({ stars: next.length ? next.join(",") : undefined })
  }

  function toggleAmenity(name: string) {
    const next = amenities.includes(name)
      ? amenities.filter((a) => a !== name)
      : [...amenities, name]
    setAmenities(next)
    apply({ amenities: next.length ? next.join(",") : undefined })
  }

  return (
    <div className="bg-white border border-border rounded-lg p-4 space-y-5 sticky top-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <button onClick={() => router.push("/search")} className="text-xs text-stayoraTeal hover:underline">
          Reset
        </button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Sort by</p>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); apply({ sort: e.target.value }) }}
          className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white"
        >
          <option value="recommended">Recommended</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Highest rated</option>
          <option value="reviews">Most reviewed</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Price per night (₹)</p>
        <div className="flex gap-2">
          <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="numeric" />
          <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" />
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => apply()}>
          Apply price
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Star rating</p>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={stars.includes(n)}
                onChange={() => toggleStar(n)}
                className="accent-stayoraTeal"
              />
              <span className="flex">
                {Array.from({ length: n }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-goldenYellow text-goldenYellow" />
                ))}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Guest rating</p>
        <select
          value={rating}
          onChange={(e) => { setRating(e.target.value); apply({ rating: e.target.value }) }}
          className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white"
        >
          <option value="">Any rating</option>
          <option value="4">4.0 and above</option>
          <option value="3">3.0 and above</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Property type</p>
        <div className="space-y-1.5">
          {TYPE_OPTIONS.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={type === t.value}
                onChange={() => { setType(t.value); apply({ type: t.value }) }}
                className="accent-stayoraTeal"
              />
              {t.label}
            </label>
          ))}
          {type && (
            <button onClick={() => { setType(""); apply({ type: "" }) }} className="text-xs text-stayoraTeal hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Amenities</p>
        <div className="space-y-1.5">
          {AMENITY_OPTIONS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={amenities.includes(a)}
                onChange={() => toggleAmenity(a)}
                className="accent-stayoraTeal"
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="accent-stayoraTeal" readOnly />
          Free cancellation
        </label>
        <p className="text-xs text-secondaryText mt-1">
          Every Stayora property offers free cancellation up to 48 hours before check-in.
        </p>
      </div>
    </div>
  )
}
