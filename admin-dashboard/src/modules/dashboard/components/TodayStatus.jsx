export default function TodayStatus({ data }) {
  const items = [
    { label: "Present", value: data.present, color: "bg-green-500" },
    { label: "Absent", value: data.absent, color: "bg-red-500" },
    { label: "Late", value: data.late, color: "bg-yellow-500" },
    { label: "On Leave", value: data.leave, color: "bg-blue-500" },
  ];

  return (
    <div>
      <h2 className="text-md font-semibold mb-4">
        Today's Status
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${item.color}`}
              ></div>
              <span className="text-sm text-gray-600">
                {item.label}
              </span>
            </div>

            <span className="font-semibold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
