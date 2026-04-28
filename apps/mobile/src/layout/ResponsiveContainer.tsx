export const ResponsiveContainer = ({ children }: any) => {
  return (
    <div className="px-4 md:px-8 lg:px-16 max-w-screen-xl mx-auto">
      {children}
    </div>
  );
};