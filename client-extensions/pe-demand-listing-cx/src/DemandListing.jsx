import React, { useEffect, useState, useCallback, useRef } from "react";
import $ from "jquery";
import { axiosPrivate } from "./common/axios";
import DemandWorkflowModal from "./DemandWorkflowModal";

window.$ = $;
window.jQuery = $;

import "datatables.net";

const DemandListing = () => {
  const [demands, setDemands] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);

  const categoryMap = useRef({});
  const priorityMap = useRef({}); 

  const loadUserAndTasks = useCallback(async () => {
    const userId = Liferay.ThemeDisplay.getUserId();

    const [userRes, taskRes] = await Promise.all([
      axiosPrivate.get(`/o/headless-admin-user/v1.0/user-accounts/${userId}`),
      axiosPrivate.get(
        "/o/headless-admin-workflow/v1.0/workflow-tasks/assigned-to-my-roles?pageSize=100"
      )
    ]);

    const roles =
      userRes.data.roleBriefs?.map(r => r.name.toLowerCase()) || [];

    console.log("Roles ===", roles);

    if (roles.includes("it manager")) setRole("itManager");
    else if (roles.includes("demand manager")) setRole("demandManager");
    else setRole("viewer");

    setTasks(taskRes.data.items || []);
  }, []);
 

  const loadPicklists = async () => {
    const res = await axiosPrivate.get(
      "/o/headless-admin-list-type/v1.0/list-type-definitions"
    );

    res.data.items.forEach(def => {
      if (def.externalReferenceCode === "CATEGORY") {
        def.listTypeEntries.forEach(e => {
          categoryMap.current[e.key] = e.name;
        });
      }

      if (def.externalReferenceCode === "PRIORITY") {
        def.listTypeEntries.forEach(e => {
          priorityMap.current[e.key] = e.name;
        });
      }
    });
  };
 

  const loadDemands = async () => {
    const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
    const res = await axiosPrivate.get(
      `/o/c/demandintakes/scopes/${scopeGroupId}`
    );
    setDemands(res.data.items || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadPicklists(),
        loadUserAndTasks(),
        loadDemands()
      ]);
      setLoading(false);
    };
    init();
  }, [loadUserAndTasks]);
 

  const renderPicklist = (value, map) => {
    if (!value) return "-";
    if (typeof value === "object" && value.key) {
      return map[value.key] || value.key;
    }
    return map[value] || value;
  };

  const getDemandStageFromStatus = (code) => {
 console.log("code ",code);
    switch (code) {
      case 1:
        return "Demand Intake";
      case 7:
        return "Pre Analysis Phase";
      case 2:
        return "Demand Initiation";
      case 0:
        return "Moved to Delivery";
      default:
        return "-";
    }
  };

  const getWorkflowTask = (demandId) =>
    tasks.find(
      t =>
        t.objectReviewed &&
        String(t.objectReviewed.id) === String(demandId)
    );
 
  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#demandTable")) {
      $("#demandTable").DataTable().destroy(true);
    }

    const table = $("#demandTable").DataTable({
      data: demands,
      searching: false,
      lengthChange: false,
    
      paging: true,
      info: true,
      autoWidth: false,
 ordering: true,   
      order: [[1, "desc"]],
      columns: [
        { title: "Item", data: "name" },
        {
          title: "Date",
          data: "dateCreated",
          render: d => d ? new Date(d).toLocaleDateString() : "-"
        },
        { title: "Demand ID", data: "demandId" },
        { title: "Azure ID", data: "azureId" },
        { title: "Initiator", data: "initiator" },
        { title: "Initiator Team", data: "initiatorTeam" },
        { title: "Business Sponsor", data: "businessSponsor" },
        { title: "Demand Description", data: "name" },
        {
          title: "Category",
          data: "category",
          render: v => renderPicklist(v, categoryMap.current)
        },
        {
          title: "Priority",
          data: "priority",
          render: v => renderPicklist(v, priorityMap.current)
        },
        {
          title: "Demand Stage",
          data: "status",
          render: (statusObj, type, row) => {
            if (!statusObj) return "-";

            const label = getDemandStageFromStatus(statusObj.code);
		console.log("Label ",label);
            const task = getWorkflowTask(row.id);

            console.log("Status =", statusObj);
            console.log("Label =", label);
            console.log("Task =", task);

            if (role === "itManager" && task) {
              return `
                <button
                  class="stage-btn"
                  data-demand-id="${row.id}">
                  ${label}
                </button>
              `;
            }

            return `<span>${label}</span>`;
          }
        }
      ]
    });

    $("#demandTable").off("click", ".stage-btn");
    $("#demandTable").on("click", ".stage-btn", function () {
	console.log("Inside modal");
      const demandId = $(this).data("demand-id");
      const demand = demands.find(d => String(d.id) === String(demandId));
      setSelectedDemand(demand);
      setActiveModal(true);
    });

    return () => table.destroy(true);
  }, [demands, loading, role, tasks]);

  /* ================= UI ================= */

  return (
    <div style={{ overflowX: "auto" }}>
       

      <table
        id="demandTable"
        className="display nowrap"
        style={{ width: "100%" }}
      />

      {activeModal && selectedDemand && (
        

        <DemandWorkflowModal
            demand={selectedDemand}
            task={getWorkflowTask(selectedDemand.id)}
            onClose={async (refresh) => {
              setActiveModal(false);
              setSelectedDemand(null);

              if (refresh) {
                setLoading(true);


                 if ($.fn.DataTable.isDataTable("#demandTable")) {
                    $("#demandTable").DataTable().clear().destroy(true);
                  }
                await loadUserAndTasks(); 
                await loadDemands();       
                setLoading(false);
              }
            }}
          />

      )}
    </div>
  );
};

export default DemandListing;
