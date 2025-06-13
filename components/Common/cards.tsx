// components/Card.tsx
import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, IconButton, Paper, Button, Fade, Zoom, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Grid from '@mui/material/Grid';
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import BarChart2 from "@mui/icons-material/BarChart";
import LineChart from "@mui/icons-material/ShowChart";
import PieChart from "@mui/icons-material/PieChart";
import ScatterChart from "@mui/icons-material/BubbleChart";
import TableViewIcon from "@mui/icons-material/TableView";
import TimelineIcon from "@mui/icons-material/Timeline";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { Rnd, RndResizeCallback } from "react-rnd";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export type ChartType = "bar" | "line" | "pie" | "scatter" | "text" | "table" | "tabular";

interface CardProps {
  id: string;
  type: ChartType;
  title?: string;
  cardSize?: { width: number; height: number };
  data: any;
  layout: any;
  position?: { x: number; y: number };
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onDragStop?: (id: string, x: number, y: number, width: number, height: number) => void;
  isPinned?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  disableDragging?: boolean;
  disableResizing?: boolean;
  chartTypeDropdown?: React.ReactNode;
  onChartTypeChange?: (type: ChartType) => void;
  onResizeStop?: (id: string, x: number, y: number, width: number, height: number) => void;
  dashboardColor?: string;
  headers?: string[];
}

// Softly mix a base color toward white to get lighter shades
function generateShades(base: string, count: number): string[] {
  const hex = base.replace('#', '');
  const r0 = parseInt(hex.slice(0, 2), 16);
  const g0 = parseInt(hex.slice(2, 4), 16);
  const b0 = parseInt(hex.slice(4, 6), 16);

  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    const factor = 0.3 + 0.7 * t; // Enhanced gradient range
    const r = Math.round(r0 + (255 - r0) * (1 - factor));
    const g = Math.round(g0 + (255 - g0) * (1 - factor));
    const b = Math.round(b0 + (255 - b0) * (1 - factor));
    return `rgb(${r},${g},${b})`;
  });
}

const Card = (props: CardProps) => {
  const {
    id, type, cardSize, title, data, layout, onDelete, onEdit, position, onDragStop, 
    isPinned, onPin, onUnpin, disableDragging, disableResizing, chartTypeDropdown, 
    onChartTypeChange, onResizeStop, dashboardColor = "#4f46e5", headers
  } = props;
  
  const [size, setSize] = useState(cardSize || { width: 400, height: 300 });
  const [resizeWarning, setResizeWarning] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize: RndResizeCallback = (_e, _dir, ref) => {
    const minWidth = type === "text" ? 200 : 320;
    const minHeight = type === "text" ? 160 : 240;
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;

    if (width < minWidth || height < minHeight) {
      setResizeWarning(`Minimum size is ${minWidth} x ${minHeight}px`);
      setSnackbarOpen(true);
      setSize({
        width: Math.max(width, minWidth),
        height: Math.max(height, minHeight),
      });
      return;
    }
    setSize({ width, height });
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
  }, []);

  const isBarLike = type === "bar" || type === "table" || type === "tabular";

  const plotMargin = type === "pie"
    ? { l: 20, r: 20, t: 30, b: 20 }
    : { l: 50, r: 20, t: 30, b: 50 };

  let plotData = data;

  if (
    Array.isArray(data) &&
    data.length === 1 &&
    typeof data[0] === "object" &&
    Array.isArray(data[0].x) &&
    Array.isArray(data[0].y)
  ) {
    if (isBarLike) {
      const barColors = generateShades(dashboardColor, data[0].x.length);
      plotData = [{ 
        ...data[0], 
        type: "bar", 
        marker: { 
          color: barColors,
          line: { color: dashboardColor, width: 1 }
        }
      }];
    } else if (type === "line") {
      plotData = [{ 
        ...data[0], 
        type: "scatter", 
        mode: "lines+markers", 
        line: { 
          color: dashboardColor, 
          width: 3,
          shape: 'spline'
        },
        marker: {
          color: dashboardColor,
          size: 8,
          line: { color: '#fff', width: 2 }
        }
      }];
    } else if (type === "scatter") {
      plotData = [{ 
        ...data[0], 
        type: "scatter", 
        mode: "markers", 
        marker: { 
          color: dashboardColor,
          size: 10,
          opacity: 0.8,
          line: { color: '#fff', width: 1 }
        }
      }];
    } else if (type === "pie") {
      const pieColors = generateShades(dashboardColor, data[0].x.length);
      plotData = [
        {
          type: "pie",
          labels: data[0].x,
          values: data[0].y,
          marker: { 
            colors: pieColors,
            line: { color: '#fff', width: 2 }
          },
          textfont: { size: 14, color: '#374151', family: 'Inter, -apple-system, sans-serif' },
          hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percentage: %{percent}<extra></extra>',
        },
      ];
    }
  }

  const chartTypes = [
    { label: 'Bar Chart', value: 'bar', icon: <BarChart2 fontSize="small" /> },
    { label: 'Line Chart', value: 'line', icon: <TimelineIcon fontSize="small" /> },
    { label: 'Pie Chart', value: 'pie', icon: <PieChart fontSize="small" /> },
    { label: 'Scatter Plot', value: 'scatter', icon: <ScatterChart fontSize="small" /> },
  ];

  console.log(headers, "data in card component");

  return (
    <>
      <Rnd
        default={{
          x: position?.x || 20,
          y: position?.y || 20,
          width: size.width,
          height: size.height
        }}
        position={position}
        size={size}
        minWidth={type === "text" ? 200 : 320}
        minHeight={type === "text" ? 160 : 240}
        onResize={onResize}
        onResizeStop={(_e, _dir, ref, _delta, positionObj) => {
          if (onResizeStop) {
            onResizeStop(
              id,
              positionObj.x,
              positionObj.y,
              ref.offsetWidth,
              ref.offsetHeight
            );
          }
        }}
        onDragStop={(_e, d) => {
          if (onDragStop) {
            onDragStop(id, d.x, d.y, size.width, size.height);
          }
        }}
        bounds="parent"
        disableDragging={disableDragging}
        enableResizing={!disableResizing}
      >
        <Paper
          elevation={0}
          ref={containerRef}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${hovered || isPinned ? dashboardColor + '40' : 'rgba(79, 70, 229, 0.08)'}`,
            boxShadow: hovered || isPinned 
              ? `0 20px 40px ${dashboardColor}20, 0 4px 12px ${dashboardColor}10`
              : '0 4px 20px rgba(79, 70, 229, 0.08)',
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: disableDragging ? "default" : "move",
            position: "relative",
            overflow: 'hidden',
            '&::before': isPinned ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${dashboardColor}, ${dashboardColor}cc)`,
              zIndex: 1,
            } : {},
            "&:hover": {
              transform: disableDragging ? 'none' : 'translateY(-2px)',
              border: `2px solid ${dashboardColor}60`,
              boxShadow: `0 24px 48px ${dashboardColor}25, 0 8px 16px ${dashboardColor}15`,
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 3,
              pb: type === "text" ? 1 : 2,
              background: isPinned 
                ? `linear-gradient(135deg, ${dashboardColor}08 0%, ${dashboardColor}04 100%)`
                : 'transparent',
              borderBottom: type === "text" ? 'none' : `1px solid ${dashboardColor}15`,
              position: 'relative',
            }}
          >
            {/* Title Section */}
            {type !== "text" && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: dashboardColor,
                    letterSpacing: '-0.02em',
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.3,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                  title={title}
                >
                  {title}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Fade in={hovered || isPinned}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  ml: 2,
                }}
              >
                <Tooltip title="Edit Widget" arrow>
                  <IconButton 
                    onClick={() => onEdit(id)} 
                    size="small"
                    sx={{
                      background: `${dashboardColor}10`,
                      color: dashboardColor,
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: `${dashboardColor}20`,
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Widget" arrow>
                  <IconButton 
                    onClick={() => onDelete(id)} 
                    size="small"
                    sx={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(239, 68, 68, 0.2)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title={isPinned ? "Unpin Widget" : "Pin Widget"} arrow>
                  <IconButton
                    onClick={isPinned ? onUnpin : onPin}
                    size="small"
                    sx={{
                      background: isPinned ? `${dashboardColor}20` : `${dashboardColor}10`,
                      color: dashboardColor,
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: `${dashboardColor}30`,
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Fade>
          </Box>

          {/* Content Section */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Chart Type Controls */}
            {type !== "text" && onChartTypeChange && (
              <Fade in={hovered}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end', 
                    gap: 1,
                    px: 3,
                    pb: 2,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0 0 0 16px',
                    border: `1px solid ${dashboardColor}20`,
                    borderTop: 'none',
                    borderRight: 'none',
                  }}
                >
                  {/* Table View Toggle */}
                  <Tooltip title={showTable ? "Show Chart" : "Show Table"} arrow>
                    <Button
                      size="small"
                      variant={showTable ? "contained" : "outlined"}
                      onClick={() => setShowTable((prev) => !prev)}
                      startIcon={<TableViewIcon />}
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        background: showTable 
                          ? `linear-gradient(135deg, ${dashboardColor} 0%, ${dashboardColor}dd 100%)`
                          : 'transparent',
                        color: showTable ? 'white' : dashboardColor,
                        borderColor: dashboardColor,
                        boxShadow: showTable ? `0 4px 12px ${dashboardColor}40` : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: showTable 
                            ? `linear-gradient(135deg, ${dashboardColor}dd 0%, ${dashboardColor}bb 100%)`
                            : `${dashboardColor}15`,
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Table
                    </Button>
                  </Tooltip>

                  {/* Chart Type Icons */}
                  {chartTypes.map((ct) => (
                    <Tooltip key={ct.value} title={ct.label} arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setShowTable(false);
                          onChartTypeChange(ct.value as ChartType);
                        }}
                        sx={{
                          background: type === ct.value && !showTable 
                            ? `linear-gradient(135deg, ${dashboardColor} 0%, ${dashboardColor}dd 100%)`
                            : `${dashboardColor}10`,
                          color: type === ct.value && !showTable ? 'white' : dashboardColor,
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          boxShadow: type === ct.value && !showTable ? `0 4px 12px ${dashboardColor}40` : 'none',
                          '&:hover': {
                            background: type === ct.value && !showTable
                              ? `linear-gradient(135deg, ${dashboardColor}dd 0%, ${dashboardColor}bb 100%)`
                              : `${dashboardColor}20`,
                            transform: 'translateY(-1px)',
                          }
                        }}
                      >
                        {ct.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              </Fade>
            )}

            {/* Main Content */}
            <Box sx={{ flex: 1, p: type === "text" ? 2 : 3, pt: type === "text" ? 1 : 3 }}>
              {type === "text" ? (
                <Box
                  sx={{
                    height: '100%',
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    background: `linear-gradient(135deg, ${dashboardColor}08 0%, ${dashboardColor}04 100%)`,
                    borderRadius: 3,
                    p: 4,
                    border: `1px solid ${dashboardColor}20`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Inter, -apple-system, sans-serif",
                      fontWeight: 800,
                      fontSize: "2.5rem",
                      background: `linear-gradient(135deg, ${dashboardColor} 0%, ${dashboardColor}cc 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.1,
                      mb: 1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {typeof data === "string"
                      ? (/^\d/.test(data.trim()) ? data.split(" ")[0] : data)
                      : typeof data === "object" && data !== null
                        ? JSON.stringify(data)
                        : "No data"}
                  </Typography>
                  
                  {typeof data === "string" && /^\d/.test(data.trim()) && (
                    <Typography
                      sx={{
                        fontFamily: "Inter, -apple-system, sans-serif",
                        fontWeight: 500,
                        fontSize: "1.1rem",
                        color: "#6b7280",
                        lineHeight: 1.4,
                        mb: 2,
                      }}
                    >
                      {data.split(" ").slice(1).join(" ")}
                    </Typography>
                  )}
                  
                  {title && (
                    <Typography
                      sx={{
                        fontFamily: "Inter, -apple-system, sans-serif",
                        fontWeight: 600,
                        fontSize: "1rem",
                        color: dashboardColor,
                        lineHeight: 1.4,
                        opacity: 0.8,
                      }}
                    >
                      {title}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ height: '100%', width: '100%' }}>
                  {showTable ? (
                    Array.isArray(data) && data.length > 0 && data[0].x && data[0].y ? (
                      <Box sx={{
                        height: '100%',
                        overflowY: 'auto',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 3,
                        border: `1px solid ${dashboardColor}20`,
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(0,0,0,0.1)',
                          borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: dashboardColor,
                          borderRadius: '3px',
                        },
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse', 
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}>
                          <thead>
                            <tr style={{ 
                              background: `linear-gradient(135deg, ${dashboardColor}15 0%, ${dashboardColor}08 100%)`,
                              position: 'sticky',
                              top: 0,
                              zIndex: 1,
                            }}>
                              {headers && headers.length > 0 ? (
                                headers.map((h, idx) => (
                                  <th key={h + idx} style={{ 
                                    border: `1px solid ${dashboardColor}30`, 
                                    padding: '12px 8px', 
                                    textAlign: 'left', 
                                    fontWeight: 700,
                                    color: dashboardColor,
                                    fontSize: '0.875rem',
                                    letterSpacing: '-0.01em',
                                  }}>
                                    {h}
                                  </th>
                                ))
                              ) : (
                                <>
                                  <th style={{ 
                                    border: `1px solid ${dashboardColor}30`, 
                                    padding: '12px 8px', 
                                    textAlign: 'left', 
                                    fontWeight: 700,
                                    color: dashboardColor,
                                    fontSize: '0.875rem',
                                  }}>X</th>
                                  <th style={{ 
                                    border: `1px solid ${dashboardColor}30`, 
                                    padding: '12px 8px', 
                                    textAlign: 'left', 
                                    fontWeight: 700,
                                    color: dashboardColor,
                                    fontSize: '0.875rem',
                                  }}>Y</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {data[0].x.map((xVal: any, idx: number) => (
                              <tr key={idx} style={{ 
                                background: idx % 2 === 0 
                                  ? 'rgba(255, 255, 255, 0.8)' 
                                  : `${dashboardColor}08`,
                                transition: 'background 0.2s',
                              }}>
                                <td style={{ 
                                  border: `1px solid ${dashboardColor}20`, 
                                  padding: '10px 8px', 
                                  fontSize: '0.875rem',
                                  color: '#374151',
                                }}>{xVal}</td>
                                <td style={{ 
                                  border: `1px solid ${dashboardColor}20`, 
                                  padding: '10px 8px', 
                                  fontSize: '0.875rem',
                                  color: '#374151',
                                  fontWeight: 500,
                                }}>{data[0].y[idx]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    ) : (
                      <Box sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${dashboardColor}08`,
                        borderRadius: 3,
                        border: `1px dashed ${dashboardColor}40`,
                      }}>
                        <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>
                          No tabular data available.
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Box sx={{ 
                      height: '100%', 
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 3,
                      border: `1px solid ${dashboardColor}20`,
                      overflow: 'hidden',
                    }}>
                      <Plot
                        data={Array.isArray(plotData) ? plotData.map(trace => ({
                          ...trace,
                          marker: {
                            ...trace.marker,
                            line: {
                              ...trace.marker?.line,
                              color: '#fff'
                            }
                          },
                          textfont: { 
                            color: '#374151', 
                            size: 12, 
                            family: 'Inter, -apple-system, sans-serif' 
                          },
                          hoverlabel: {
                            bgcolor: dashboardColor,
                            bordercolor: dashboardColor,
                            font: { color: 'white', family: 'Inter, -apple-system, sans-serif' }
                          }
                        })) : plotData}
                        layout={{
                          ...layout,
                          autosize: true,
                          margin: plotMargin,
                          width: size.width - 40,
                          height: size.height - 140,
                          font: { 
                            color: '#374151', 
                            family: "Inter, -apple-system, sans-serif",
                            size: 12
                          },
                          plot_bgcolor: 'rgba(255, 255, 255, 0.8)',
                          paper_bgcolor: 'transparent',
                          legend: {
                            orientation: "h",
                            x: 0.5,
                            y: -0.15,
                            xanchor: "center",
                            font: { color: '#374151', size: 11, family: "Inter, -apple-system, sans-serif" },
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            bordercolor: `${dashboardColor}40`,
                            borderwidth: 1,
                          },
                          xaxis: {
                            ...layout?.xaxis,
                            gridcolor: `${dashboardColor}20`,
                            linecolor: `${dashboardColor}40`,
                            tickcolor: `${dashboardColor}40`,
                          },
                          yaxis: {
                            ...layout?.yaxis,
                            gridcolor: `${dashboardColor}20`,
                            linecolor: `${dashboardColor}40`,
                            tickcolor: `${dashboardColor}40`,
                          },
                        }}
                        useResizeHandler
                        style={{ width: "100%", height: "100%" }}
                        config={{
                          responsive: true,
                          displayModeBar: hovered,
                          modeBarButtonsToRemove: [
                            "select2d",
                            "lasso2d",
                            "autoScale2d",
                            "resetScale2d",
                            "toggleSpikelines",
                            "hoverClosestCartesian",
                            "hoverCompareCartesian"
                          ],
                          scrollZoom: true
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Rnd>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          left: "50%",
          transform: "translateX(-50%)",
          top: "20vh"
        }}
      >
        <MuiAlert
          elevation={8}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          severity="warning"
          sx={{ 
            width: '100%',
            borderRadius: 3,
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 500,
            boxShadow: '0 12px 32px rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {resizeWarning}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Card;