import React from "react";
import {
  LayoutContext,
  WEEK_WIDTH,
  ROW_HEIGHT,
  NAME_COLUMN_WIDTH,
} from "./layout";

export const LayoutProvider: React.FC<{
  children: React.ReactNode;
  weekWidth?: number;
  rowHeight?: number;
  nameColumnWidth?: number;
}> = ({ children, weekWidth, rowHeight, nameColumnWidth }) => {
  return (
    <LayoutContext.Provider
      value={{
        weekWidth: weekWidth ?? WEEK_WIDTH,
        rowHeight: rowHeight ?? ROW_HEIGHT,
        nameColumnWidth: nameColumnWidth ?? NAME_COLUMN_WIDTH,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
