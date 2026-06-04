export const getAllCartFoods = (items) => {
  if (!items || items.length === 0) return [];
  return items.flatMap(x => x.foods || []);
}

export const getTotalCartItemPrice = (items) => {
  if (!items || items.length === 0) return '0.0';
  
  // Sum up prices with quantity support
  const total = items
    .flatMap(x => x.foods || [])
    .reduce((total, item) => {
      const quantity = item.quantity || 1;
      const price = Number(item.price) || 0;
      return total + (price * quantity);
    }, 0);
  
  return total.toFixed(1);
}

// NEW: Get total items count (with quantities)
export const getTotalCartItemsCount = (items) => {
  if (!items || items.length === 0) return 0;
  
  return items
    .flatMap(x => x.foods || [])
    .reduce((total, item) => total + (item.quantity || 1), 0);
}