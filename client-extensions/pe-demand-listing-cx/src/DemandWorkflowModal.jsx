// import React, { useEffect, useState } from "react";
// import { axiosPrivate } from "./common/axios";

// export default function DemandWorkflowModal({ demand, task, onClose }) {
//   const [transitions, setTransitions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadTransitions = async () => {
//       const res = await axiosPrivate.get(
//         `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}`
//       );
//       console.log("Result -->  ",res);
//       console.log("Result for transitions ",res.data.transitions)
//       setTransitions(res.data.transitions || []);
//       setLoading(false);
//     };
//     loadTransitions();
//   }, [task.id]);

//   const executeTransition = async (transitionName) => {
//     console.log("Transition Name ---> ",transitionName);
//     await axiosPrivate.post(
//       `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
//       {
//         transitionName
//       }
//     );
//     onClose(true);  
//   };

//   return (
   
//     <div className="modal">
//       <h4>{demand.name}</h4>

//       {loading ? (
//         <p>Loading actions...</p>
//       ) : (
//         transitions.map(t => (
//           <button
//             key={t.name}
//             className="action-btn"
//             onClick={() => executeTransition(t.name)}
//           >
//             {t.label}
//           </button>
//         ))
//       )}

//       <button className="close-btn" onClick={() => onClose(false)}>
//         Close
//       </button>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { axiosPrivate } from "./common/axios";

export default function DemandWorkflowModal({ demand, task, onClose }) {
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransitions = async () => {
      try {
        console.log("Inside modal");
        console.log("Task =", task);

        const res = await axiosPrivate.get(
          `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/next-transitions`
        );

        console.log("Transitions response =", res.data);

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
    console.log("changing transition ---> ",transitionName);
    try {
    //   await axiosPrivate.post(
    //     `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
    //     {
    //       transitionName
    //     }
    //   );

    console.log("Object Entry ID =", demand.id);
console.log("Workflow Task ID =", task.id);
console.log("Workflow Instance ID =", task.workflowInstanceId);

    await axiosPrivate.post(
        `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
        {
            transitionName,
            comment: "Moved via UI"
        }
        );


      onClose(true); // refresh listing
    } catch (e) {
      console.error("Transition failed", e);
      alert("Failed to move demand to next stage");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
         

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

