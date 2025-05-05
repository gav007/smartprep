
import React from 'react';

// This layout can be used to add specific styling or context for all tool pages.
// For now, it just renders the children.
export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
