"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Card, { ChartType } from "@/components/Common/cards";
import dynamic from "next/dynamic";
import DashboardSidebar from "./DashboardSidebar";
import { getAiTables, askDBDashboard, dashboardUpdate, getUserDashboard, dashboardCreate, askDB } from "../../utils/api";
import AddIcon from "@mui/icons-material/Add";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ChartConfig {
  id: string;
  type: ChartType;
  data: any;
  title?: string;
  layout: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  question?: string;
}

const generateDummyData = (type: ChartType) => {
  switch (type) {
    case "bar":
      return {
        data: [{ x: ["A", "B", "C"], y: [10, 20, 15], type: "bar" }],
        layout: { title: "Bar Chart" },
      };
    case "line":
      return {
        data: [{ x: [1, 2, 3], y: [2, 6, 3], type: "scatter", mode: "lines+markers" }],
        layout: { title: "Line Chart" },
      };
    case "pie":
      return {
        data: [{ values: [19, 26, 55], labels: ["A", "B", "C"], type: "pie" }],
        layout: { title: "Pie Chart" },
      };
    case "scatter":
      return {
        data: [{ x: [1, 2, 3, 4], y: [10, 15, 13, 17], mode: "markers", type: "scatter" }],
        layout: { title: "Scatter Plot" },
      };
    case "text":
      return {
        data: "This is a text block inside a card.",
        layout: {},
      };
  }
};

const DEFAULT_USER_ID = '56376e63-0377-413d-8c9e-359028e2380d';
const DEFAULT_USER_NAME = 'chandra@ctrls.com';

const Dashboard = () => {
  // --- State ---
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardKeys, setDashboardKeys] = useState<string[]>([]);
  const [defaultDashboardId, setDefaultDashboardId] = useState<string>("");
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [cards, setCards] = useState<ChartConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChartType, setNewChartType] = useState<ChartType>("bar");
  const [newChartTitle, setNewChartTitle] = useState<string>("");
  const [newChartQuestion, setNewChartQuestion] = useState<string>("");
  const [editTileId, setEditTileId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [addDashboardDialogOpen, setAddDashboardDialogOpen] = useState(false);
  const [newDashboardTitle, setNewDashboardTitle] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const [aiTablesOptions, setAiTablesOptions] = useState<{ table_id: string; table_name: string }[]>([]);
  const [selectedAiTables, setSelectedAiTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinnedCards, setPinnedCards] = useState<string[]>([]);
  const [pinWarning, setPinWarning] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [cardsBackup, setCardsBackup] = useState<ChartConfig[]>([]);
  const [axisDialogOpen, setAxisDialogOpen] = useState(false);
  // State for axis selection
  const [axisOptions, setAxisOptions] = useState<string[]>([]);
  const [selectedXAxis, setSelectedXAxis] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [pendingChartData, setPendingChartData] = useState<any>(null);
  const [selectedYAxes, setSelectedYAxes] = useState<string[]>([]);

  // Fetch dashboard data on load
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const apiRes = await getUserDashboard(DEFAULT_USER_NAME);
        const data = apiRes.data;
        setDashboardData(data);
        const keys = Object.keys(data.dashboards);
        setDashboardKeys(keys);
        setDefaultDashboardId(data.default_dashboard);
        setSelectedDashboard(data.default_dashboard);
        // Load tiles for default dashboard
        handleDashboardSelect(data.default_dashboard, data);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch AI tables when add dashboard dialog opens
  useEffect(() => {
    if (addDashboardDialogOpen) {
      getAiTables().then((res) => {
        // Remove duplicates by table_id
        const uniqueTables = Array.from(
          new Map(res.map((t: any) => [t.table_id, t])).values()
        ) as { table_id: string; table_name: string }[];
        setAiTablesOptions(uniqueTables);
      });
    }
  }, [addDashboardDialogOpen]);

  //patietn class
  //average waiting time by type 
  // Handle dashboard selection and load tiles as cards
  const handleDashboardSelect = async (dashboardId: string, dataOverride?: any) => {
    setLoading(true);
    try {
      const data = dataOverride || dashboardData;
      setSelectedDashboard(dashboardId);
      const dashboard = data.dashboards[dashboardId];
      if (!dashboard) return;

      // Get all tile keys except "description"
      const tileKeys = Object.keys(dashboard).filter((key) => key !== "description");

      // Prepare cards from tiles
      const newCards: ChartConfig[] = [];
      let yOffset = 20;
      let xOffset = 20;
      const cardWidth = 400;
      const cardHeight = 300;
      const margin = 20;
      const maxWidth = window.innerWidth || 1200; // fallback for SSR

      for (const tileKey of tileKeys) {
        const tile = dashboard[tileKey];
        if (!tile?.question) continue;

        // Use position and size from tile if available, else fallback
        const position = tile.position || { x: xOffset, y: yOffset };
        const size = tile.size || { width: cardWidth, height: cardHeight };

        try {
          const res = await askDBDashboard({
            user_id: DEFAULT_USER_ID,
            question: tile.question,
            dashboard: dashboardId, // or selectedDashboard if that's your key
            tile: tileKey,
          });

          let chartData: any = {};
          let chartLayout: any = {};
          let chartType: ChartType = (tile.graph_type as ChartType) || "bar";

          if (
            res?.response?.data?.data?.data &&
            Array.isArray(res.response.data.data.data)
          ) {
            const tableData = res.response.data.data.data;
            const headers = tableData[0];
            const rows = tableData.slice(1);

            // --- Use x_axis, y_axis, series from tile if present ---
            if (headers.length >= 3 && tile.x_axis && tile.y_axis && tile.series) {
              const xIdx = headers.indexOf(tile.x_axis);
              const yIdx = headers.indexOf(tile.y_axis);
              const seriesIdx = headers.indexOf(tile.series);

              const seriesGroups: { [key: string]: { x: any[]; y: any[] } } = {};
              rows.forEach((row: any) => {
                const group = row[seriesIdx];
                if (!seriesGroups[group]) seriesGroups[group] = { x: [], y: [] };
                seriesGroups[group].x.push(row[xIdx]);
                seriesGroups[group].y.push(row[yIdx]);
              });

              chartData = Object.entries(seriesGroups).map(([group, vals]) => ({
                x: vals.x,
                y: vals.y,
                type: chartType,
                name: group,
              }));
              chartLayout = { title: tile.graph_title || tileKey };
            } else if (headers.length >= 2) {
              // Fallback to default: first column X, second column Y
              chartData = [
                {
                  x: rows.map((row: any[]) => row[0]),
                  y: rows.map((row: any[]) => row[1]),
                  type: chartType,
                  marker: { color: "#2563eb" },
                },
              ];
              chartLayout = { title: tile.graph_title || tileKey };
            }
            newCards.push({
              id: `${dashboardId}-${tileKey}`,
              type: chartType,
              title: tile.graph_title || tileKey,
              data: chartType === "text" && typeof chartData !== "string" ? String(chartData) : chartData,
              layout: chartLayout,
              position,
              size,
              question: tile.question,
            });
            yOffset += 320;
            continue;
          } else if (
            res?.response?.data?.type === "text" &&
            typeof res.response.data.data === "string"
          ) {
            // Handle text response
            chartType = "text";
            chartData = res.response.data.data;
            chartLayout = {};
          } else if (res?.response?.data?.type) {
            chartType = res.response.data.type as ChartType;
          } else {
            chartType = (tile.graph_type as ChartType) || "bar";
          }

          newCards.push({
            id: `${dashboardId}-${tileKey}`,
            type: chartType,
            title: tile.graph_title || tileKey,
            data: chartData,
            layout: chartLayout,
            position,
            size,
            question: tile.question,
          });
          yOffset += 320;
        } catch (err) {
          const chartType: ChartType = (tile.graph_type as ChartType) || "bar";
          const dummy = generateDummyData(chartType);
          newCards.push({
            id: `${dashboardId}-${tileKey}`,
            type: chartType,
            data: dummy?.data,
            layout: dummy?.layout,
            position,
            size,
            question: tile.question,
          });
          yOffset += 320;
        }

        // Calculate next position: try to add to the right, else move to next row
        xOffset += cardWidth + margin;
        if (xOffset + cardWidth > maxWidth - 240) { // 240px for sidebar
          xOffset = 20;
          yOffset += cardHeight + margin;
        }
      }
      setCards(newCards);
      setCardsBackup(newCards);
    } finally {
      setLoading(false);
    }
  };

  // When entering edit mode, save a backup of the current cards
const handleEditMode = () => {
  if (!editMode) {
    setCardsBackup(cards);
    setEditMode(true);
  } else {
    // On cancel, revert cards to backup and exit edit mode
    setCards(cardsBackup);
    setEditMode(false);
  }
};

  // --- Pin/Unpin Handlers ---
  const handlePinCard = (id: string) => {
    setPinnedCards((prev) => prev.includes(id) ? prev : [...prev, id]);
  };
  const handleUnpinCard = (id: string) => {
    setPinnedCards((prev) => prev.filter((pid) => pid !== id));
  };

  // --- Modified handleDragStop: remove dashboardUpdate call ---
  const handleDragStop = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const margin = 20;
    const sidebarWidth = 240;
    const maxWidth = (window.innerWidth || 1200) - sidebarWidth;

    // Update the dragged card's position
    let updatedCards = cards.map((card) =>
      card.id === id
        ? { ...card, position: { x, y }, size: { width, height } }
        : { ...card }
    );

    // Helper to check overlap
    const isOverlapping = (a: ChartConfig, b: ChartConfig) => {
      return !(
        a.position.x + a.size.width <= b.position.x ||
        a.position.x >= b.position.x + b.size.width ||
        a.position.y + a.size.height <= b.position.y ||
        a.position.y >= b.position.y + b.size.height
      );
    };

    // Only move the overlapped cards, not the dragged one
    const draggedCard = updatedCards.find((c) => c.id === id);
    if (!draggedCard) return;

    // Check for overlap with pinned cards
    for (const card of updatedCards) {
      if (card.id !== id && pinnedCards.includes(card.id) && isOverlapping(draggedCard, card)) {
        setPinWarning("You cannot drag a card over a pinned card. Please unpin it first and try again.");
        // Revert the dragged card's position
        setCards(cards);
        setTimeout(() => setPinWarning(null), 2000);
        return;
      }
    }

    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i];
        if (card.id === id) continue;
        if (isOverlapping(draggedCard, card) && !pinnedCards.includes(card.id)) {
          // Try to move the overlapped card to the right
          let newX = draggedCard.position.x + draggedCard.size.width + margin;
          let newY = card.position.y;
          if (newX + card.size.width <= maxWidth) {
            updatedCards[i] = {
              ...card,
              position: { ...card.position, x: newX }
            };
          } else {
            // Move overlapped card below the dragged card
            newX = 20;
            newY = draggedCard.position.y + draggedCard.size.height + margin;
            updatedCards[i] = {
              ...card,
              position: { x: newX, y: newY }
            };
          }
          moved = true;
        }
      }
    }

    setCards(updatedCards);

    // --- Removed dashboardUpdate call here ---
    // The API will only be called when handleSaveLayout is triggered
  };

  // Open dialog for editing a tile
  const handleEditTile = (id: string) => {
    const tile = cards.find((c) => c.id === id);
    if (!tile) return;

    setNewChartType(tile.type);
    setNewChartTitle(tile.title || "");
    setNewChartQuestion(tile.question || "");
    setEditTileId(id);

    // Try to get axis info from dashboardData
    const tileKey = id.split("-").slice(1).join("-");
    const tileMeta = dashboardData?.dashboards?.[selectedDashboard]?.[tileKey];

    if (Array.isArray(tile.data) && tile.data.length > 1 && tileMeta?.headers?.length >= 3) {
      const headers = tileMeta.headers;
      setAxisOptions(headers);
      setSelectedXAxis(tileMeta.x_axis || headers[1] || "");
      setSelectedSeries(tileMeta.series || headers[0] || "");
      setSelectedYAxes(
        tileMeta.y_axis
          ? Array.isArray(tileMeta.y_axis)
            ? tileMeta.y_axis
            : [tileMeta.y_axis]
          : [headers[2]]
      );
    } else {
      setAxisOptions([]);
      setSelectedXAxis("");
      setSelectedSeries("");
      setSelectedYAxes([]);
    }

    setDialogOpen(true);
  };

  // Add or Edit Chart Handler
  const handleAddOrEditChart = async () => {
    if (!newChartTitle || !newChartQuestion) return;
    setLoading(true);
    try {
      // Determine dashboard and tile keys
      const dashboardKey = selectedDashboard;
      let tileKey = "";

      if (editTileId) {
        // Editing: extract tile key from id
        tileKey = editTileId.split("-").slice(1).join("-");
      } else {
        // Adding: generate a new tile key in the form tile1, tile2, ...
        const existingTiles = Object.keys(dashboardData.dashboards[selectedDashboard])
          .filter((k) => k.startsWith("tile"));
        let maxNum = 0;
        existingTiles.forEach((k) => {
          const num = parseInt(k.replace("tile", ""), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        });
        tileKey = `tile${maxNum + 1}`;
      }

      // Make askDBDashboard call with dashboard and tile keys
      const res = await askDBDashboard({
        user_id: DEFAULT_USER_ID,
        question: newChartQuestion,
        dashboard: dashboardKey,
        tile: tileKey
      });

      // Extract chart data and type from response
      let chartData: any = {};
      let chartLayout: any = {};
      let chartType: ChartType = newChartType;

      if (
        res?.response?.data?.data?.data &&
        Array.isArray(res.response.data.data.data)
      ) {
        const tableData = res.response.data.data.data;
        const headers = tableData[0];
        const rows = tableData.slice(1);

        if (headers.length >= 3) {
          // Prompt user to select axes
          setAxisOptions(headers);
          setSelectedXAxis(headers[1]); // e.g., "month"
          setSelectedSeries(headers[0]); // e.g., "appointment_type"
          // Default: select all numeric columns as Y axes
          const numericCols = headers.filter((h:any, i:any) =>
            rows.some((row:any) => typeof row[i] === "number")
          );
          setSelectedYAxes(numericCols.length ? numericCols : [headers[2]]);
          setPendingChartData({ headers, rows, raw: tableData });
          setAxisDialogOpen(true);
          setLoading(false);
          return; // Wait for user selection before proceeding
        }

        if (headers.length >= 2) {
          chartData = [
            {
              x: rows.map((row: any[]) => row[0]),
              y: rows.map((row: any[]) => row[1]),
              type: newChartType,
              marker: { color: "#2563eb" },
            },
          ];
          chartLayout = { title: newChartTitle };
        }
      } else if (
        res?.response?.data?.type === "text" &&
        typeof res.response.data.data === "string"
      ) {
        // Handle text response
        chartType = "text";
        chartData = res.response.data.data;
        chartLayout = {};
      } else if (res?.response?.data?.type) {
        // chartType = res.response.data.type as ChartType;
      } else {
        chartType = newChartType;
      }

      // Fallback to dummy if no data
      if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) {
        const dummy = generateDummyData(chartType);
        chartData = dummy?.data;
        chartLayout = dummy?.layout;
      }

      if (editTileId) {
        // Edit existing card
        setCards((prev) =>
          prev.map((c) =>
            c.id === editTileId
              ? {
                  ...c,
                  type: chartType,
                  title: newChartTitle,
                  data: chartType === "text" && typeof chartData !== "string" ? String(chartData) : chartData,
                  layout: chartLayout,
                  question: newChartQuestion,
                }
              : c
          )
        );

        // Update dashboardData in memory
        dashboardData.dashboards[selectedDashboard][tileKey] = {
          graph_title: newChartTitle,
          graph_type: chartType,
          question: newChartQuestion,
        };

        const updatePayload = {
          default_dashboard: selectedDashboard,
          dashboards: dashboardData.dashboards,
          ai_tables: dashboardData.ai_tables,
        };

        await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);
      } else {
        // Add new card
        const cardWidth = 400;
        const cardHeight = 300;
        const margin = 20;
        const sidebarWidth = 240;
        const maxWidth = (window.innerWidth || 1200) - sidebarWidth;

        let xOffset = 20;
        let yOffset = 20;

        // Find a position to the right of existing cards, else below
        outer: for (let y = 20; ; y += cardHeight + margin) {
          for (let x = 20; x + cardWidth <= maxWidth; x += cardWidth + margin) {
            const overlap = cards.some(
              (c) =>
                Math.abs((c.position?.x || 0) - x) < cardWidth &&
                Math.abs((c.position?.y || 0) - y) < cardHeight
            );
            if (!overlap) {
              xOffset = x;
              yOffset = y;
              break outer;
            }
          }
        }

        const cardId = `${selectedDashboard}-${tileKey}`;
        const newCard = {
          id: cardId,
          type: chartType,
          title: newChartTitle,
          data: chartType === "text" && typeof chartData !== "string" ? String(chartData) : chartData,
          layout: chartLayout,
          position: { x: xOffset, y: yOffset },
          size: { width: cardWidth, height: cardHeight },
          question: newChartQuestion,
        };
        setCards([...cards, newCard]);

        // Add to dashboardData in memory with position and size
        dashboardData.dashboards[selectedDashboard][tileKey] = {
          graph_title: newChartTitle,
          graph_type: chartType,
          question: newChartQuestion,
          position: { x: xOffset, y: yOffset },
          size: { width: cardWidth, height: cardHeight },
        };

        const updatePayload = {
          default_dashboard: selectedDashboard,
          dashboards: dashboardData.dashboards,
          ai_tables: dashboardData.ai_tables,
        };

        await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);
      }

      // Reset dialog fields and close
      setNewChartTitle("");
      setNewChartQuestion("");
      setNewChartType(newChartType || "bar");
      setDialogOpen(false);
      setEditTileId(null);
    } catch (err) {
      alert("Failed to add/edit chart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update deleteCard to just open the dialog
  const handleDeleteRequest = (id: string) => {
    setDeleteCardId(id);
    setDeleteDialogOpen(true);
  };

  // Actual delete logic
  const confirmDeleteCard = async () => {
    if (!deleteCardId) return;
    setLoading(true);
    try {
      setCards(cards.filter((c) => c.id !== deleteCardId));

      const tileKey = deleteCardId.split("-").slice(1).join("-");
      if (
        dashboardData &&
        dashboardData.dashboards &&
        dashboardData.dashboards[selectedDashboard] &&
        dashboardData.dashboards[selectedDashboard][tileKey]
      ) {
        delete dashboardData.dashboards[selectedDashboard][tileKey];

        const updatePayload = {
          default_dashboard: selectedDashboard,
          dashboards: dashboardData.dashboards, // send all dashboards, not just the edited one
          ai_tables: dashboardData.ai_tables,
        };
        await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteCardId(null);
    }
  };

  // --- Add Dashboard handler ---
  const handleAddDashboard = async () => {
    if (!newDashboardTitle) return;
    setLoading(true);
    try {
      // --- For create ---
      if (!dashboardData || !dashboardData.dashboards || Object.keys(dashboardData.dashboards).length === 0) {
        const now = new Date().toUTCString();
        let newKeyNum = 1;
        while (dashboardData?.dashboards?.[`dashboard_${newKeyNum}`]) {
          newKeyNum++;
        }
        const newDashboardKey = `dashboard_${newKeyNum}`;
        const newDashboards = {
          [newDashboardKey]: {
            description: {
              dashboard_title: newDashboardTitle,
              dashboard_description: newDashboardDescription,
              dashboard_last_update: now,
            },
          },
        };
        // Use selectedAiTables for ai_tables
        const newAiTables = { [newDashboardKey]: selectedAiTables };

        await dashboardCreate(DEFAULT_USER_NAME, JSON.stringify({
          username: DEFAULT_USER_NAME,
          dashboards: newDashboards,
          ai_tables: newAiTables,
          default_dashboard: newDashboardKey,
        }));

        setDashboardData({
          ...dashboardData,
          dashboards: newDashboards,
          ai_tables: newAiTables,
          default_dashboard: newDashboardKey,
        });
        setDashboardKeys([newDashboardKey]);
        setDefaultDashboardId(newDashboardKey);
        setSelectedDashboard(newDashboardKey);
        setAddDashboardDialogOpen(false);
        setNewDashboardTitle("");
        setNewDashboardDescription("");
        setSelectedAiTables([]);
        return;
      }

      // --- For update ---
      let newKeyNum = 1;
      while (dashboardData.dashboards[`dashboard_${newKeyNum}`]) {
        newKeyNum++;
      }
      const newDashboardKey = `dashboard_${newKeyNum}`;
      const now = new Date().toUTCString();

      dashboardData.dashboards[newDashboardKey] = {
        description: {
          dashboard_title: newDashboardTitle,
          dashboard_description: newDashboardDescription,
          dashboard_last_update: now,
        },
      };
      dashboardData.ai_tables[newDashboardKey] = selectedAiTables;

      const updatePayload = {
        username: DEFAULT_USER_NAME,
        dashboards: dashboardData.dashboards,
        ai_tables: dashboardData.ai_tables,
        default_dashboard: dashboardData.default_dashboard,
      };
      await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);

      setDashboardData({ ...dashboardData });
      setDashboardKeys(Object.keys(dashboardData.dashboards));
      setAddDashboardDialogOpen(false);
      setNewDashboardTitle("");
      setNewDashboardDescription("");
      setSelectedAiTables([]);
    } finally {
      setLoading(false);
    }
  };

  // Save new positions and sizes after editing
  const handleSaveLayout = async () => {
    if (!dashboardData) return;
    // Update dashboardData with new positions and sizes
    const updatedDashboard = { ...dashboardData.dashboards[selectedDashboard] };
    cards.forEach((card) => {
      const tileKey = card.id.split("-").slice(1).join("-");
      if (updatedDashboard[tileKey]) {
        updatedDashboard[tileKey].position = card.position;
        updatedDashboard[tileKey].size = card.size;
      }
    });
    dashboardData.dashboards[selectedDashboard] = updatedDashboard;

    const updatePayload = {
      username: DEFAULT_USER_NAME,
      dashboards: dashboardData.dashboards,
      ai_tables: dashboardData.ai_tables,
      default_dashboard: dashboardData.default_dashboard,
    };
    setLoading(true);
    try {
      await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAxisSelection = async () => {
    if (!pendingChartData) return;
    const { headers, rows } = pendingChartData;

    const xIdx = headers.indexOf(selectedXAxis);
    const seriesIdx = headers.indexOf(selectedSeries);

    // For each selected Y axis, create a trace for each series group
    let traces: any[] = [];
    selectedYAxes.forEach((yAxis) => {
      const yIdx = headers.indexOf(yAxis);
      // Group by series
      const groups: { [key: string]: { x: any[]; y: any[] } } = {};
      rows.forEach((row: any) => {
        const group = row[seriesIdx];
        if (!groups[group]) groups[group] = { x: [], y: [] };
        groups[group].x.push(row[xIdx]);
        groups[group].y.push(row[yIdx]);
      });
      Object.entries(groups).forEach(([group, vals]) => {
        traces.push({
          x: vals.x,
          y: vals.y,
          type: newChartType,
          name: `${group} - ${yAxis}`,
        });
      });
    });

    // Find the tile key for the card being edited/added
    let tileKey = "";
    if (editTileId) {
      tileKey = editTileId.split("-").slice(1).join("-");
    } else {
      // Adding: generate a new tile key in the form tile1, tile2, ...
      const existingTiles = Object.keys(dashboardData.dashboards[selectedDashboard])
        .filter((k) => k.startsWith("tile"));
      let maxNum = 0;
      existingTiles.forEach((k) => {
        const num = parseInt(k.replace("tile", ""), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      tileKey = `tile${maxNum + 1}`;
    }

    // Add or update the card in state
    if (editTileId) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === editTileId
            ? {
                ...c,
                type: newChartType,
                data: traces,
                layout: { ...c.layout, title: newChartTitle },
                question: newChartQuestion,
              }
            : c
        )
      );
    } else {
      const cardWidth = 400;
      const cardHeight = 300;
      const margin = 20;
      const sidebarWidth = 240;
      const maxWidth = (window.innerWidth || 1200) - sidebarWidth;

      let xOffset = 20;
      let yOffset = 20;

      // Find a position to the right of existing cards, else below
      outer: for (let y = 20; ; y += cardHeight + margin) {
        for (let x = 20; x + cardWidth <= maxWidth; x += cardWidth + margin) {
          const overlap = cards.some(
            (c) =>
              Math.abs((c.position?.x || 0) - x) < cardWidth &&
              Math.abs((c.position?.y || 0) - y) < cardHeight
          );
          if (!overlap) {
            xOffset = x;
            yOffset = y;
            break outer;
          }
        }
      }

      const cardId = `${selectedDashboard}-${tileKey}`;
      const newCard = {
        id: cardId,
        type: newChartType,
        title: newChartTitle,
        data: traces,
        layout: { title: newChartTitle },
        position: { x: xOffset, y: yOffset },
        size: { width: cardWidth, height: cardHeight },
        question: newChartQuestion,
      };
      setCards([...cards, newCard]);

      // Add to dashboardData in memory with position and size and axes
      dashboardData.dashboards[selectedDashboard][tileKey] = {
        graph_title: newChartTitle,
        graph_type: newChartType,
        question: newChartQuestion,
        position: { x: xOffset, y: yOffset },
        size: { width: cardWidth, height: cardHeight },
        x_axis: selectedXAxis,
        y_axis: selectedXAxis,
        series: selectedSeries,
      };
    }

    // Store axis selections in dashboardData for both add and edit
    if (
      dashboardData &&
      dashboardData.dashboards &&
      dashboardData.dashboards[selectedDashboard] &&
      dashboardData.dashboards[selectedDashboard][tileKey]
    ) {
      dashboardData.dashboards[selectedDashboard][tileKey].x_axis = selectedXAxis;
      dashboardData.dashboards[selectedDashboard][tileKey].y_axis = selectedYAxes;
      dashboardData.dashboards[selectedDashboard][tileKey].series = selectedSeries;
    }

    // Update backend with new axis selections and/or new tile
    const updatePayload = {
      username: DEFAULT_USER_NAME,
      dashboards: dashboardData.dashboards,
      ai_tables: dashboardData.ai_tables,
      default_dashboard: dashboardData.default_dashboard,
    };
    setLoading(true);
    try {
      await dashboardUpdate(DEFAULT_USER_NAME, updatePayload);
    } finally {
      setLoading(false);
    }

    setPendingChartData(null);
  };

  // --- Sidebar rendering ---
  return (
    <Box
      display="flex"
      minHeight="100vh"
      sx={{
        ml: "-5rem",
        background: "linear-gradient(120deg, #e9efff 0%, #f5f8ff 100%)"
      }}
    >
      {loading && (
        <div className="oscar-loading-overlay">
          <div className="oscar-spinner"></div>
          <div className="oscar-loading-text">Loading...</div>
        </div>
      )}
      {/* Sidebar */}
      {dashboardData && (
        <DashboardSidebar
          dashboardKeys={dashboardKeys}
          dashboards={dashboardData.dashboards}
          selectedDashboard={selectedDashboard}
          setSelectedDashboard={(id) => handleDashboardSelect(id)}
          onAddDashboard={() => setAddDashboardDialogOpen(true)}
        />
      )}

      {/* Main content */}
      <Box flex={1} p={3} position="relative">
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2} gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditTileId(null);
              setDialogOpen(true);
            }}
            sx={{
              bgcolor: "#0a2fff",
              color: "#fff",
              fontWeight: 600,
              borderRadius: "10px",
              textTransform: "none",
              boxShadow: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                bgcolor: "#0039cb"
              }
            }}
          >
            Add Card
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleEditMode}
            sx={{
              borderColor: "#0a2fff",
              color: "#0a2fff",
              fontWeight: 600,
              borderRadius: "10px",
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                borderColor: "#0039cb",
                color: "#0039cb",
                background: "#f5f8ff"
              }
            }}
          >
            {editMode ? "Cancel Edit" : "Edit Layout"}
          </Button>
          {editMode && (
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveLayout}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              Save Layout
            </Button>
          )}
        </Box>

        <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditTileId(null); }}>
          <DialogTitle>{editTileId ? "Edit Chart" : "Add Chart"}</DialogTitle>
          <DialogContent sx={{pt:1}}>
            <FormControl fullWidth sx={{ mb: 2}}>
              <InputLabel id="chart-type-label">Chart Type</InputLabel>
              <Select
                labelId="chart-type-label"
                value={newChartType}
                label="Chart Type"
                onChange={(e) => setNewChartType(e.target.value as ChartType)}
              >
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="pie">Pie</MenuItem>
                <MenuItem value="scatter">Scatter</MenuItem>
                <MenuItem value="text">Text</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              value={newChartTitle}
              onChange={(e) => setNewChartTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Question"
              value={newChartQuestion}
              onChange={(e) => setNewChartQuestion(e.target.value)}
              multiline
              minRows={2}
            />

            {/* Axis selection fields, only show if axisOptions.length >= 3 */}
            {axisOptions.length >= 3 && (
              <>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>X Axis</InputLabel>
                  <Select
                    value={selectedXAxis}
                    label="X Axis"
                    onChange={e => setSelectedXAxis(e.target.value)}
                  >
                    {axisOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Y Axis</InputLabel>
                  <Select
                    multiple
                    value={selectedYAxes}
                    label="Y Axis"
                    onChange={e => setSelectedYAxes(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {axisOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Series (Color/Group)</InputLabel>
                  <Select
                    value={selectedSeries}
                    label="Series"
                    onChange={e => setSelectedSeries(e.target.value)}
                  >
                    {axisOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDialogOpen(false); setEditTileId(null); }}>Cancel</Button>
            <Button variant="contained" onClick={handleAddOrEditChart}>
              {editTileId ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>

        <Box position="relative" minHeight="100vh" display="flex" bgcolor="#f9f9f9" sx={{
      background: "linear-gradient(120deg, #e9efff 0%, #f5f8ff 100%)"
    }}>
          {cards.map((card) => (
            <Card
              key={card.id}
              {...card}
              cardSize={card.size}
              onDelete={handleDeleteRequest}
              onEdit={handleEditTile}
              onDragStop={editMode ? handleDragStop : undefined}
              disableDragging={!editMode}
              disableResizing={!editMode}
              isPinned={pinnedCards.includes(card.id)}
              onPin={() => handlePinCard(card.id)}
              onUnpin={() => handleUnpinCard(card.id)}
              onChartTypeChange={(newType) => {
                setCards((prev) =>
                  prev.map((c) =>
                    c.id === card.id
                      ? {
                          ...c,
                          type: newType,
                          data: Array.isArray(c.data)
                            ? c.data.map(trace => ({ ...trace, type: newType }))
                            : c.data,
                          layout: { ...c.layout, title: c.title }
                        }
                      : c
                  )
                );
                // Optionally update dashboardData as well if you want to persist type change
                const tileKey = card.id.split("-").slice(1).join("-");
                if (
                  dashboardData &&
                  dashboardData.dashboards &&
                  dashboardData.dashboards[selectedDashboard] &&
                  dashboardData.dashboards[selectedDashboard][tileKey]
                ) {
                  dashboardData.dashboards[selectedDashboard][tileKey].graph_type = newType;
                }
              }}
              onResizeStop={(id, x, y, width, height) => {
                setCards((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? { ...c, position: { x, y }, size: { width, height } }
                      : c
                  )
                );
              }}
            />
          ))}
          {/* Pin warning message */}
          {pinWarning && (
            <div
              style={{
                position: "fixed",
                top: 80,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fffbe6",
                color: "#b26a00",
                border: "1px solid #ffe082",
                borderRadius: 8,
                padding: "12px 32px",
                zIndex: 3000,
                fontWeight: 600,
                fontSize: "1.1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}
            >
              {pinWarning}
            </div>
          )}
        </Box>
        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this card?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={confirmDeleteCard}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Dashboard Dialog */}
        <Dialog open={addDashboardDialogOpen} onClose={() => setAddDashboardDialogOpen(false)}>
          <DialogTitle>Add Dashboard</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Dashboard Title"
              value={newDashboardTitle}
              onChange={(e) => setNewDashboardTitle(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Dashboard Description"
              value={newDashboardDescription}
              onChange={(e) => setNewDashboardDescription(e.target.value)}
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="ai-tables-label">AI Tables</InputLabel>
              <Select
                labelId="ai-tables-label"
                multiple
                value={selectedAiTables}
                onChange={(e) => setSelectedAiTables(e.target.value as string[])}
                label="AI Tables"
                renderValue={(selected) =>
                  selected
                    .map(
                      (id) =>
                        aiTablesOptions.find((t) => t.table_id === id)?.table_name || id
                    )
                    .join(", ")
                }
              >
                {aiTablesOptions.map((table) => (
                  <MenuItem key={table.table_id} value={table.table_id}>
                    {table.table_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDashboardDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddDashboard}>
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Axis Selection Dialog */}
        <Dialog open={axisDialogOpen} onClose={() => setAxisDialogOpen(false)}>
          <DialogTitle>Select Chart Axes</DialogTitle>
          <DialogContent>
            {axisOptions.length >= 3 && (
  <>
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>X Axis</InputLabel>
      <Select
        value={selectedXAxis}
        label="X Axis"
        onChange={e => setSelectedXAxis(e.target.value)}
      >
        {axisOptions.map(opt => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>Y Axis</InputLabel>
      <Select
        multiple
        value={selectedYAxes}
        label="Y Axis"
        onChange={e => setSelectedYAxes(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
        renderValue={(selected) => selected.join(", ")}
      >
        {axisOptions.map(opt => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </Select>
    </FormControl>
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>Series (Color/Group)</InputLabel>
      <Select
        value={selectedSeries}
        label="Series"
        onChange={e => setSelectedSeries(e.target.value)}
      >
        {axisOptions.map(opt => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </Select>
    </FormControl>
  </>
)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAxisDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleAxisSelection();
                setAxisDialogOpen(false);
                 setDialogOpen(false); 
                 setEditTileId(null);
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Dashboard;
