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

    if (roles.includes("it manager")) setRole("itManager");
    else if (roles.includes("demand manager")) setRole("demandManager");
    else setRole("viewer");

    setTasks(taskRes.data.items || []);
  }, []);

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
      `/o/c/demandintakes/scopes/${scopeGroupId}`
    );
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

  /* ========= HELPERS ========= */

  const getWorkflowTask = demandId =>
    tasks.find(
      t =>
        t.objectReviewed &&
        String(t.objectReviewed.id) === String(demandId)
    );

  const renderPill = (label, color) => {
    if (!label) return "-";
    return `
      <span style="
        background:${color || "#BDBDBD"};
        color:#fff;
        padding:4px 10px;
        border-radius:6px;
        font-size:12px;
        font-weight:600;
        white-space:nowrap;
        display:inline-block;">
        ${label}
      </span>
    `;
  };

  /* ========= DATATABLE ========= */

  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#demandTable")) {
      $("#demandTable").DataTable().destroy(true);
    }

    const table = $("#demandTable").DataTable({
      data: demands,
      paging: true,
      searching: false,
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

        {
          title: "Category",
          render: (_, __, row) => {
            const cfg = categoryMap.current[row.r_categoryId_c_categoryTypeId];
            return renderPill(cfg?.label, cfg?.color);
          }
        },

        {
          title: "Priority",
          render: (_, __, row) => {
            const cfg = priorityMap.current[row.r_priorityId_c_priorityTypeId];
            return renderPill(cfg?.label, cfg?.color);
          }
        },

        {
          title: "Demand Stage",
          render: (_, __, row) => {
            const cfg =
              stageMap.current[row.r_demandStageId_c_demandStageTypeId];
            const task = getWorkflowTask(row.id);

            if (role === "itManager" && task) {
              return `
                <button class="stage-btn"
                  data-demand-id="${row.id}"
                  style="background:${cfg?.color};
                         color:#fff;
                         border:none;
                         padding:4px 10px;
                         border-radius:6px;
                         font-weight:600;">
                  ${cfg?.label}
                </button>
              `;
            }

            return renderPill(cfg?.label, cfg?.color);
          }
        }
      ]
    });

    $("#demandTable").off("click", ".stage-btn");
    $("#demandTable").on("click", ".stage-btn", function () {
      const demandId = $(this).data("demand-id");
      const demand = demands.find(d => String(d.id) === String(demandId));
      setSelectedDemand(demand);
      setActiveModal(true);
    });

    return () => table.destroy(true);
  }, [demands, loading, role, tasks]);

  /* ========= UI ========= */

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        id="demandTable"
        className="display nowrap stripe row-border"
        style={{ width: "100%" }}
      />

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
