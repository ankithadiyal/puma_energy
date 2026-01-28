import React, { useEffect, useState, useCallback, useRef } from "react";
import $ from "jquery";
import { axiosPrivate } from "./common/axios";
import DemandWorkflowModal from "./DemandWorkflowModal";
import "./styles/DemandList.css";
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

  /* ========= MASTER MAPS (ID -> {label,color}) ========= */
  const categoryMap = useRef({});
  const priorityMap = useRef({});
  const stageMap = useRef({});

  /* ========= LOAD USER + TASKS ========= */

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
    console.log("roles :: ", roles);
    if (roles.includes("it manager")) setRole("itManager");
    else if (roles.includes("demand manager")) setRole("demandManager");
    else if (roles.includes("demand approver")) setRole("demandApprover")
    else if (roles.includes("business approver")) setRole("businessApprover")
    else setRole("viewer");

    console.log("taskRes.data.items || [] :: ", taskRes.data.items || [])
    setTasks(taskRes.data.items || []);
  }, []);




  const getTaskAssignedDemandIds = useCallback(() => {
    let s=new Set(
      tasks
        .filter(t => t.objectReviewed?.id)
        .map(t => String(t.objectReviewed.id))
    );
    console.log("S values is the :: ",s)
    return s;
  }, [tasks]);


  const getFilteredDemands = useCallback(() => {
      if (role === "demandManager") {
    console.log("Demand Manager → showing all demands");
    return demands;
  }
    const assignedDemandIds = getTaskAssignedDemandIds();
    console.log("assignedDemandIds :: ",assignedDemandIds)
    const final=demands.filter(d =>
      assignedDemandIds.has(String(d.id))
    );
    console.log("final :: ",final)
    return final;
  }, [demands, getTaskAssignedDemandIds]);






  /* ========= LOAD MASTER OBJECTS ========= */

  const loadCategoryTypes = async () => {
    const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
    const res = await axiosPrivate.get(`/o/c/categorytypes/scopes/${scopeGroupId}`);
    res.data.items.forEach(i => {
      categoryMap.current[i.id] = {
        label: i.categoryType,
        color: i.color
      };
    });
  };

  const loadPriorityTypes = async () => {
    const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
    const res = await axiosPrivate.get(`/o/c/prioritytypes/scopes/${scopeGroupId}`);

    res.data.items.forEach(i => {
      priorityMap.current[i.id] = {
        label: i.priorityType,
        color: i.color
      };
    });
  };

  const loadDemandStageTypes = async () => {
    const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
    const res = await axiosPrivate.get(`/o/c/demandstagetypes/scopes/${scopeGroupId}`);

    res.data.items.forEach(i => {
      stageMap.current[i.id] = {
        label: i.demandStageType,
        color: i.color
      };
    });
  };

  /* ========= LOAD DEMANDS ========= */

  const loadDemands = async () => {
    const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
    const res = await axiosPrivate.get(
      `/o/c/demandintakes/scopes/${scopeGroupId}?pageSize=100`
    );
    console.log("res.data.items in loadDemands :: ", res.data.items);
    setDemands(res.data.items || []);
  };

  /* ========= INIT ========= */

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadCategoryTypes(),
        loadPriorityTypes(),
        loadDemandStageTypes(),
        loadUserAndTasks(),
        loadDemands()
      ]);
      setLoading(false);
    };
    init();
  }, [loadUserAndTasks]);
 
  const getWorkflowTask = demandId =>
    tasks.find(
      t =>
        t.objectReviewed &&
        String(t.objectReviewed.id) === String(demandId)
    );

  const renderPill = (label, color, isFullBox = false) => {
    


    if (!label) return "-";
    return `
    <span class="status-pill" style="
      background:${color || "#9CA3AF"};
      color:#fff;">
      ${label}
    </span>
  `;
  };



const formatLabel = label =>
  label
    ?.replace(/-/g, " ")            
    .toLowerCase()                    
    .replace(/\b\w/g, char => char.toUpperCase());  

  /* ========= DATATABLE ========= */

  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#demandTable")) {
      $("#demandTable").DataTable().destroy(true);
    }
const filteredDemands = getFilteredDemands();
console.log("filteredDemands :: ",filteredDemands)
    const table = $("#demandTable").DataTable({
      data: filteredDemands,
      paging: true,
      searching: false,
      ordering: true,
      order: [[1, "desc"]],
      scrollX: true,
      scrollY: "500px",
      scrollCollapse: true,
      autoWidth: false,
      dom: 'rt<"bottom"lip>',
      columns: [
        {
          title: "Demand Name",
          data: "name",
          width: "180px"
        },
        {
          title: "Date",
          data: "dateCreated",
          width: "100px",
          render: d => d ? new Date(d).toLocaleDateString() : "-"
        },
        {
          title: "Demand ID",
          data: "demandId",
          width: "100px"
        },
        {
          title: "Initiator",
          data: "initiator",
          width: "120px"
        },
        {
          title: "Initiator Team",
          data: "initiatorTeam",
          width: "140px"
        },
        {
          title: "Business Sponsor",
          data: "businessSponsor",
          width: "140px"
        },
        {
          title: "Azure Id",
          data: "azureId",
          width: "100px"
        },
        {
          title: "Value",
          data: "value",
          width: "100px"
        },
        {
          title: "Demand Description",
          data: "demandDescription",
          width: "200px"
        },
        {
          title: "Category",
          width: "120px",
          data: null,
          createdCell: (td, cellData, rowData, row, col) => {
            const cfg = categoryMap.current[rowData.r_categoryId_c_categoryTypeId];
            if (cfg?.color) {
              $(td).css({
                'background-color': cfg.color,
                'color': '#fff',
                'font-weight': '600',
                'text-align': 'center',
                'text-transform': 'uppercase',
                'font-size': '12px',
                'letter-spacing': '0.5px'
              });
            }
          },
        
          render: (data, type, row) => {
            const cfg = categoryMap.current[row.r_categoryId_c_categoryTypeId];
            return cfg?.label || "-";
          }
        },
        {
          title: "Priority",
          width: "120px",
          data: null,
          createdCell: (td, cellData, rowData, row, col) => {
            const cfg = priorityMap.current[rowData.r_priorityId_c_priorityTypeId];
            if (cfg?.color) {
              $(td).css({
                'background-color': cfg.color,
                'color': '#fff',
                'font-weight': '600',
                'text-align': 'center',
                'text-transform': 'uppercase',
                'font-size': '12px',
                'letter-spacing': '0.5px'
              });
            }
          },
          
          render: (data, type, row) => {
            const cfg = priorityMap.current[row.r_priorityId_c_priorityTypeId];
            return cfg?.label || "-";
          }
        },
        {
          title: "Demand Stage",
          width: "160px",
          data: null,
          createdCell: (td, cellData, rowData, row, col) => {
            const cfg = stageMap.current[rowData.r_demandStageId_c_demandStageTypeId];
            console.log("rowData : ",rowData)
            const task = getWorkflowTask(rowData.id);
            // console.log(" createdCell task is the :; ",task)
            const stageLabel = cfg?.label?.toLowerCase();

            if (cfg?.color) {
              $(td).css({
                'background-color': cfg.color,
                'color': '#fff',
                'font-weight': '600',
                'text-align': 'center',
                'text-transform': 'uppercase',
                'font-size': '12px',
                'letter-spacing': '0.5px'
              });
            }
          },
          render: (_, __, row) => {
            const cfg =
              stageMap.current[row.r_demandStageId_c_demandStageTypeId];
            const task = getWorkflowTask(row.id);

            const stageLabel = cfg?.label?.toLowerCase();
            if (stageLabel === "move to delivery") {
              // return renderPill(cfg?.label, cfg?.color,true);
              return cfg?.label || "-";
            }

            console.log("inside the check of the role :: ,", role)
            console.log("task is the :: ", task)
            console.log("checking n::::::---->   ", (role === "demandManager" && task))
            if (task) {
              return `
                <button class="stage-btn"
                  data-demand-id="${row.id}"
                  style="background:${cfg?.color || "#667eea"};
                         color:#fff;">
                  ${formatLabel(cfg?.label) || "Demand Intake"}
                </button>
              `;
            }

            // return renderPill(cfg?.label, cfg?.color,true);
            return cfg?.label || "-";
          }
        }
      ],
      language: {
        search: "Search:",
        lengthMenu: "Show _MENU_ entries",
        info: "Showing _START_ to _END_ of _TOTAL_ entries",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous"
        }
      }
    });

    // Handle stage button clicks
    $("#demandTable").off("click", ".stage-btn");
    $("#demandTable").on("click", ".stage-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const demandId = $(this).data("demand-id");
      const demand = demands.find(d => String(d.id) === String(demandId));
      if (demand) {
        setSelectedDemand(demand);
        setActiveModal(true);
      }
    });

    return () => {
      $("#demandTable").off("click", ".stage-btn");
      table.destroy(true);
    };
  }, [demands, loading, role, tasks]);

  /* ========= UI ========= */

  if (loading) {
    return (
      <div className="demand-listing-container">
        <div className="table-wrapper">
          <p style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            Loading demands...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="demand-listing-container">
      <div className="table-wrapper">
        <table
          id="demandTable"
          className="display nowrap stripe"
          style={{ width: "100%" }}
        />
      </div>

      {activeModal && selectedDemand && (
        <DemandWorkflowModal
          demand={selectedDemand}
          task={getWorkflowTask(selectedDemand.id)}
          onClose={async refresh => {
            setActiveModal(false);
            setSelectedDemand(null);
            if (refresh) {
              setLoading(true);
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
