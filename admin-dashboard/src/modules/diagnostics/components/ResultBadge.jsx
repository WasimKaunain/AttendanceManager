export default function ResultBadge({ success }) {
    return success ? (
        <span className="px-2 py-1 rounded-md text-xs
                         bg-emerald-100
                         text-emerald-700
                         dark:bg-emerald-900/40
                         dark:text-emerald-300">
            PASS
        </span>
    ) : (
        <span className="px-2 py-1 rounded-md text-xs
                         bg-red-100
                         text-red-700
                         dark:bg-red-900/40
                         dark:text-red-300">
            FAIL
        </span>
    );
}