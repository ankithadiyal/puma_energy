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
        console.log("res.data.items :: ",res.data.items)

        const allowedTransitionName = getAllowedTransitionName();
        console.log("Allowed transition =", allowedTransitionName);

        const filteredTransitions = (res.data.items || []).filter(
          t => t.name === allowedTransitionName
        );

        // setTransitions(filteredTransitions);
        console.log("setTransitions :: ",res)
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
 
const normalize = str =>
  str
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "").trim();


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
 
       const response =await axiosPrivate.post(
        `/o/headless-admin-workflow/v1.0/workflow-tasks/${task.id}/change-transition`,
        {
          transitionName,
          comment: "Moved via Demand UI"
        }
      );
      console.log("Workflow transition response:", response);
      console.log("Response data:", response.data);
      console.log("Status:", response.status);

      const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
      const res = await axiosPrivate.get(`/o/c/demandstagetypes/scopes/${scopeGroupId}`);
    
 
  console.log("transitionName?.trim().toLowerCase() :: ",transitionName?.trim().toLowerCase())
 

const matchedStage = res.data.items.find(item =>
  normalize(item.demandStageType) === normalize(transitionName)
);
    
    
    if (matchedStage) {
      console.log("Matched Demand Stage Type:", matchedStage);
      console.log("Stage ID:", matchedStage.id);
      console.log("Stage Label:", matchedStage.demandStageType);
      console.log("Stage Color:", matchedStage.color);
      console.log("${demand.id}",demand.id)
  await new Promise(resolve => setTimeout(resolve, 1500));


  await axiosPrivate.put(
    `/o/c/demandintakes/${demand.id}`,
    {
      r_demandStageId_c_demandStageTypeId: matchedStage.id
    }
  );
  
    } else {
      console.warn("No matching Demand Stage Type found for transition:", transitionName);
    }
 
    console.log("Demand stage updated successfully");


      // onClose(true);  
        window.location.reload();
    } catch (e) {
      console.error("Transition failed", e);
      alert("Failed to move demand to next stage");
    }
  };
 

const formatLabel = label =>
  label
    ?.replace(/-/g, " ")               
    .toLowerCase()                      
    .replace(/\b\w/g, char => char.toUpperCase()); 




    const getAllowedTransitionName = () => {
    const value = Number(demand?.value || 0);

    console.log("Demand VALUE =", value);

    if (value <= 5000) {
      return "moveToDelivery";
    } else if (value > 5000 && value <= 50000) {
      return "moveToDemandApprover";
    } else {
      return "moveToBusinessApprover";
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
              {formatLabel(t.label)}
            </button>
          ))}

        <button className="close-btn" onClick={() => onClose(false)}>
          Close
        </button>
      </div>
    </div>
  );
}
