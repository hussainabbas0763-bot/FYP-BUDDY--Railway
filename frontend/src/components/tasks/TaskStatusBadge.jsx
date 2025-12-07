import React from "react";

export default function TaskStatusBadge({ status, isLate }) {
    const s = String(status || "").toLowerCase();
    let cls = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    let text = status || "Assigned";

    if (s === "accepted") {
        cls = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        text = "Accepted";
    } else if (s === "rejected") {
        cls = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        text = "Rejected";
    } else if (s === "submitted") {
        cls = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        text = "Submitted";
    } else if (isLate) {
        cls = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        text = "Overdue";
    } else {
        cls = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
        text = "Pending";
    }

    return (
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cls}`}>
            {text}
        </div>
    );
}


