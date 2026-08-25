import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn utility function", () => {
  it("should merge simple class strings", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2")
    expect(cn("font-bold", "text-center", "underline")).toBe("font-bold text-center underline")
  })

  it("should handle conditional class names and ignore falsy values", () => {
    const isTrue = true
    const isFalse = false
    expect(cn("px-2", isFalse && "py-2", isTrue && "mt-4", null, undefined, "")).toBe("px-2 mt-4")
  })

  it("should correctly resolve conflicting Tailwind classes using twMerge", () => {
    // Tailwind override tests
    expect(cn("px-2", "px-4")).toBe("px-4")
    expect(cn("p-4", "px-2")).toBe("p-4 px-2")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
    expect(cn("mt-2", "mt-4")).toBe("mt-4")
  })

  it("should support object syntax for conditional classes", () => {
    expect(
      cn({
        "bg-red-500": true,
        "text-white": false,
        "p-4": true,
      })
    ).toBe("bg-red-500 p-4")
  })

  it("should support array inputs including nested arrays", () => {
    expect(cn(["px-2", "py-2"], ["mt-4"])).toBe("px-2 py-2 mt-4")
    expect(cn(["px-2", ["py-2", { "text-red-500": true }]])).toBe("px-2 py-2 text-red-500")
  })

  it("should handle mixed class inputs", () => {
    const isError = true
    const isDisabled = false

    expect(
      cn(
        "base-class",
        isError && "border-red-500",
        isDisabled && "opacity-50",
        { "bg-gray-100": true },
        ["text-sm", "font-medium"]
      )
    ).toBe("base-class border-red-500 bg-gray-100 text-sm font-medium")
  })

  it("should return empty string when given no arguments or only falsy inputs", () => {
    expect(cn()).toBe("")
    expect(cn("", null, undefined, false)).toBe("")
  })
})
