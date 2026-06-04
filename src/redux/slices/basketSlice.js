import { createSlice, createSelector } from "@reduxjs/toolkit"
import { getAllCartFoods, getTotalCartItemPrice } from "./helpers"

const initialState = {
  items: [],
}

const basketSlice = createSlice({
  name: "busket",
  initialState,
  reducers: {
    // Keep your original actions
    updateBusket: (state, action) => {
      state.items = action.payload
    },
    addExtraItem: (state, action) => {
      state.items.push(action.payload)
    },
    
    // NEW: Add the missing addToBasket action
    addToBasket: (state, action) => {
      const { resName, foods } = action.payload;
      
      // Find if brand already exists in cart
      const existingBrandIndex = state.items.findIndex(
        item => item.resName === resName
      );

      if (existingBrandIndex >= 0) {
        // Brand exists, add or update parts
        const existingBrand = state.items[existingBrandIndex];
        const newParts = [...existingBrand.foods];
        
        foods.forEach(newPart => {
          const existingPartIndex = newParts.findIndex(
            part => String(part.id) === String(newPart.id)
          );
          
          if (existingPartIndex >= 0) {
            // Part exists, increase quantity
            newParts[existingPartIndex] = {
              ...newParts[existingPartIndex],
              quantity: (newParts[existingPartIndex].quantity || 1) + (newPart.quantity || 1)
            };
          } else {
            // New part, add it
            newParts.push({
              ...newPart,
              quantity: newPart.quantity || 1
            });
          }
        });

        state.items[existingBrandIndex] = {
          ...existingBrand,
          foods: newParts
        };
      } else {
        // New brand, add it
        state.items.push({
          resName,
          foods: foods.map(part => ({
            ...part,
            quantity: part.quantity || 1
          }))
        });
      }
    },

    // NEW: Add removeFromBasket action
    removeFromBasket: (state, action) => {
      const { id, resName } = action.payload;
      
      const brandIndex = state.items.findIndex(
        item => item.resName === resName
      );

      if (brandIndex >= 0) {
        const brand = state.items[brandIndex];
        const updatedParts = brand.foods.filter(
          part => String(part.id) !== String(id)
        );

        if (updatedParts.length === 0) {
          // Remove brand if no parts left
          state.items.splice(brandIndex, 1);
        } else {
          state.items[brandIndex] = {
            ...brand,
            foods: updatedParts
          };
        }
      }
    },

    // NEW: Add clearBasket action
    clearBasket: (state) => {
      state.items = [];
    },

    // NEW: Add updateQuantity action
    updateQuantity: (state, action) => {
      const { id, resName, quantity } = action.payload;
      
      const brandIndex = state.items.findIndex(
        item => item.resName === resName
      );

      if (brandIndex >= 0) {
        const partIndex = state.items[brandIndex].foods.findIndex(
          part => String(part.id) === String(id)
        );

        if (partIndex >= 0) {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            state.items[brandIndex].foods.splice(partIndex, 1);
            
            // Remove brand if no items left
            if (state.items[brandIndex].foods.length === 0) {
              state.items.splice(brandIndex, 1);
            }
          } else {
            // Update quantity
            state.items[brandIndex].foods[partIndex] = {
              ...state.items[brandIndex].foods[partIndex],
              quantity
            };
          }
        }
      }
    },
  },
})

// Export ALL actions (including the new ones)
export const { 
  updateBusket, 
  addExtraItem,
  addToBasket,      // NEW
  removeFromBasket, // NEW
  clearBasket,      // NEW
  updateQuantity    // NEW
} = basketSlice.actions

export const selectCartItems = (state) => state.busket.items

export const selectTotalPrice = createSelector(
  [selectCartItems],
  (items) => {
    // Calculate total with quantity support
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, brand) => {
      return total + brand.foods.reduce((sum, part) => {
        const quantity = part.quantity || 1;
        return sum + (Number(part.price) * quantity);
      }, 0);
    }, 0);
  }
)

export const selectTotalItems = createSelector(
  [selectCartItems],
  (items) => getAllCartFoods(items)
)

// NEW: Additional helpful selectors
export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (items) => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, brand) => {
      return total + brand.foods.reduce((sum, part) => {
        return sum + (part.quantity || 1);
      }, 0);
    }, 0);
  }
)

export const selectBrandItems = (resName) => createSelector(
  [selectCartItems],
  (items) => {
    const brand = items.find(item => item.resName === resName);
    return brand ? brand.foods : [];
  }
)

export default basketSlice.reducer