import React, { createContext } from "react";
import { useWindowDimensions } from "react-native";

export const OrientationContext = createContext("portrait");

export const OrientationProvider = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const orientation = width > height ? "landscape" : "portrait";

  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
};
