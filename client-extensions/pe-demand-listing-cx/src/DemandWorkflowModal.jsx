import React, { useEffect, useState } from "react";
import { axiosPrivate } from "./common/axios";

export default function DemandWorkflowModal({ demand, task, onClose }) {
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pAuth = Liferay.authToken;
 

  useEffect(() => {
    const loadTransitions = async () => {
      try {
        console.log("Inside modal");
        console.log("Workflow Task =", task);

        const res = await axiosPrivate.get(
          `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/next-transitions`
        );

        setTransitions(res.data.items || []);
      } catch (e) {
        console.error("Failed to load transitions", e);
        setError("Failed to load workflow actions");
      } finally {
        setLoading(false);
      }
    };

    if (task?.id) {
      loadTransitions();
    }
  }, [task]);
 
  const executeTransition = async (transitionName) => {
    try {
      console.log("Executing transition:", transitionName);
      console.log("Workflow Task ID:", task.id);
 
      await axiosPrivate.post(
        `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/assign-to-me`,
        {
          comment: "Auto-assigned via Demand UI"
        }
      );
 
      await axiosPrivate.post(
        `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
        {
          transitionName,
          comment: "Moved via Demand UI"
        }
      );

      // onClose(true);  
        window.location.reload();
    } catch (e) {
      console.error("Transition failed", e);
      alert("Failed to move demand to next stage");
    }
  };
 

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>{demand.name}</h4>

        {loading && <p>Loading workflow actions...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && transitions.length === 0 && (
          <p>No actions available</p>
        )}
  
        {!loading &&
          transitions.map(t => (
            <button
              key={t.name}
              className="action-btn"
              onClick={() => executeTransition(t.name)}
            >
              {t.label}
            </button>
          ))}

        <button className="close-btn" onClick={() => onClose(false)}>
          Close
        </button>
      </div>
    </div>
  );
}
