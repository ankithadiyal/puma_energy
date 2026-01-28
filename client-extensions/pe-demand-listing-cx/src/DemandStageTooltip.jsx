import React, { useEffect, useRef, useState } from "react";
import { axiosPrivate } from "./common/axios";

const DemandStageTooltip = ({ demand, task, position, onClose, onSuccess }) => {
  const [actions, setActions] = useState([]);
  const ref = useRef();

  useEffect(() => {
    const loadActions = async () => {
      const res = await axiosPrivate.get(
        `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/next-transitions`
      );
      setActions(res.data.items || []);
    };
    if (task?.id) loadActions();
  }, [task]);

  /* Close on outside click */
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const execute = async transitionName => {
    await axiosPrivate.post(
      `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/assign-to-me`,
      { comment: "Auto assign" }
    );

    await axiosPrivate.post(
      `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
      { transitionName }
    );

    onSuccess();
  };

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        background: "#fff",
        border: "1px solid #ddd",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        borderRadius: 6,
        zIndex: 9999,
        minWidth: 200
      }}
    >
      {actions.map(a => (
        <div
          key={a.name}
          style={{
            padding: "8px 12px",
            cursor: "pointer"
          }}
          onClick={() => execute(a.name)}
        >
          {a.label}
        </div>
      ))}
    </div>
  );
};

export default DemandStageTooltip;
