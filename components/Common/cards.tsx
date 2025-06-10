// components/Card.tsx
import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, IconButton, Paper, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Grid from '@mui/material/Grid';
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import BarChart2 from "@mui/icons-material/BarChart";
import LineChart from "@mui/icons-material/ShowChart";
import PieChart from "@mui/icons-material/PieChart";
import ScatterChart from "@mui/icons-material/BubbleChart";
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
  dashboardColor?: string; // NEW: dashboard color for chart palette
  headers?: string[]; // NEW: headers for tabular data
}

const CARD_BG = "#fff";
const CARD_BORDER = "#e9efff";
const CARD_SHADOW = "0 1.5px 8px 0 rgba(10,47,255,0.06)";
const CARD_SHADOW_HOVER = "0 8px 32px 0 rgba(10,47,255,0.18)";
const TITLE_COLOR = "#0a2fff";
const SERIES_DOT = "#2563eb";

// Softly mix a base color toward white to get lighter shades
function generateShades(base: string, count: number): string[] {
  const hex = base.replace('#', '');
  const r0 = parseInt(hex.slice(0, 2), 16);
  const g0 = parseInt(hex.slice(2, 4), 16);
  const b0 = parseInt(hex.slice(4, 6), 16);

  return Array.from({ length: count }, (_, i) => {
    // i = 0 → darkest (~base), i = count-1 → lightest (toward white)
    const t = i / Math.max(1, count - 1);
    const factor = 0.5 + 0.5 * t; // range [0.5, 1.0]
    const r = Math.round(r0 + (255 - r0) * (1 - factor));
    const g = Math.round(g0 + (255 - g0) * (1 - factor));
    const b = Math.round(b0 + (255 - b0) * (1 - factor));
    return `rgb(${r},${g},${b})`;
  });
}

const Card = (props: CardProps) => {
  const {
    id, type, cardSize, title, data, layout, onDelete, onEdit, position, onDragStop, isPinned, onPin, onUnpin, disableDragging, disableResizing, chartTypeDropdown, onChartTypeChange, onResizeStop, dashboardColor, headers
  } = props;
  const [size, setSize] = useState(cardSize || { width: 400, height: 300 });
  const [resizeWarning, setResizeWarning] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize: RndResizeCallback = (_e, _dir, ref) => {
    const minWidth = type=="text"? 158:270;
    const minHeight =  type=="text"? 134:200;
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;

    if (width < minWidth || height < minHeight) {
      setResizeWarning("Minimum size is 270 x 200");
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

  // Use bar chart for table/tabular types
  const isBarLike = type === "bar" || type === "table" || type === "tabular";

  // Pie chart margin fix
  const plotMargin =
    type === "pie"
      ? { l: 10, r: 10, t: 10, b: 10 }
      : { l: 35, r: 5, t: 5, b: 36 };

  // Convert data to correct graph type if needed
  let plotData = data;

  // Use dashboardColor for chart palette
  const chartColor = dashboardColor || '#4472C4';

  if (
    Array.isArray(data) &&
    data.length === 1 &&
    typeof data[0] === "object" &&
    Array.isArray(data[0].x) &&
    Array.isArray(data[0].y)
  ) {
    if (isBarLike) {
      // Use a gradient for bar series
      const barColors = generateShades(chartColor, data[0].x.length);
      plotData = [{ ...data[0], type: "bar", marker: { color: barColors } }];
    } else if (type === "line") {
      plotData = [{ ...data[0], type: "scatter", mode: "lines+markers", line: { color: chartColor } }];
    } else if (type === "scatter") {
      plotData = [{ ...data[0], type: "scatter", mode: "markers", marker: { color: chartColor } }];
    } else if (type === "pie") {
      // Use a gradient palette for pie
      const pieColors = generateShades(chartColor, data[0].x.length);
      plotData = [
        {
          type: "pie",
          labels: data[0].x,
          values: data[0].y,
          marker: { colors: pieColors },
        },
      ];
    }
  }

  const titleStyle = {
    maxWidth: size.width - 80,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
    verticalAlign: "middle",
    cursor: "pointer",
    color: TITLE_COLOR,
    fontWeight: 700,
    fontSize: "1.1rem",
    letterSpacing: 0.1,
  };

  const chartTypes = [
    { label: 'Bar', value: 'bar', icon: <BarChart2 fontSize="small" /> },
    { label: 'Line', value: 'line', icon: <LineChart fontSize="small" /> },
    { label: 'Pie', value: 'pie', icon: <PieChart fontSize="small" /> },
    { label: 'Scatter', value: 'scatter', icon: <ScatterChart fontSize="small" /> },
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
        minWidth={type=="text"? 158:270}
        minHeight={ type=="text"? 134:200}
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
            borderRadius: '18px',
            background: CARD_BG,
            boxShadow: hovered ? CARD_SHADOW_HOVER : CARD_SHADOW,
            border: `1.5px solid ${CARD_BORDER}`,
            transition: "box-shadow 0.2s, border 0.2s",
            cursor: hovered ? "pointer" : "default",
            position: "relative",
            p: 0,
            "&:hover": {
              boxShadow: CARD_SHADOW_HOVER,
              border: `1.5px solid ${SERIES_DOT}`,
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={2}
            pt={2}
            pb={0}
          >
            {type !== "text" &&
            <Typography
              variant="subtitle1"
              sx={{
                ...titleStyle,
                color: dashboardColor || TITLE_COLOR, // Use dashboard color for title
              }}
              title={title}
            >
              {title}
            </Typography>
}
            {/* Show actions only on hover */}
            <Box
              sx={{
                display: hovered ? "flex" : "none",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <IconButton onClick={() => onEdit(id)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => onDelete(id)} size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={isPinned ? onUnpin : onPin}
                size="small"
                color={isPinned ? "primary" : "default"}
                title={isPinned ? "Unpin" : "Pin"}
              >
                {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
              </IconButton>
            </Box>
          </Box>
         
          <Box flexGrow={1} display="flex" flexDirection="column"  >
            {/* Unified row for Table button and chart type icons */}
            {type !== "text" && onChartTypeChange && (
              <Box display="flex" alignItems="center" justifyContent="flex-end" mt={1} mb={1}>
                {/* Table button */}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowTable((prev) => !prev)}
                  sx={{
                    bgcolor: showTable ? (dashboardColor ? `${dashboardColor}22` : "#e9efff") : "transparent",
                    borderRadius: 1,
                    mx: 0.25,
                    p: 0.5,
                    width: "40px",
                    textTransform: "none",
                    color: dashboardColor || "#0a2fff",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderColor: dashboardColor || "#0a2fff",
                    '&:hover': {
                      bgcolor: dashboardColor ? `${dashboardColor}33` : "#e9efff"
                    }
                  }}
                  title={showTable ? "Show Chart" : "Show Table"}
                >
                  Table
                </Button>
                {/* Chart type icons */}
                {chartTypes.map((ct) => (
                  <IconButton
                    key={ct.value}
                    size="small"
                    color={type === ct.value && !showTable ? "primary" : "default"}
                    onClick={() => {
                      setShowTable(false);
                      onChartTypeChange(ct.value as ChartType);
                    }}
                    sx={{
                      bgcolor: type === ct.value && !showTable ? (dashboardColor ? `${dashboardColor}22` : "#e9efff") : "transparent",
                      color: dashboardColor || (type === ct.value && !showTable ? "#0a2fff" : undefined),
                      borderRadius: 1,
                      mx: 0.25,
                      p: 0.5,
                      '&:hover': {
                        bgcolor: dashboardColor ? `${dashboardColor}33` : "#e9efff"
                      }
                    }}
                  >
                    {ct.icon}
                  </IconButton>
                ))}
              </Box>
            )}
            
            {type === "text" ? (
              <Box
                sx={{
                  p: "16px",
                  gap: "10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    color: dashboardColor || "#0a2fff", // Use dashboard color for text
                    textAlign: "center",
                    lineHeight: "1.2",
                    mb: "2px"
                  }}
                >
                  {typeof data === "string"
                    ? (/^\d/.test(data.trim()) ? data.split(" ")[0] : data)
                    : typeof data === "object" && data !== null
                      ? JSON.stringify(data)
                      : "No data"}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "1rem",
                    color: "#6b7280",
                    textAlign: "center",
                    lineHeight: "1.2"
                  }}
                >
                  {typeof data === "string" && /^\d/.test(data.trim()) ? data.split(" ").slice(1).join(" ") : ""}
                </Typography>
                {title && (
                  <Typography
                    sx={{
                      fontFamily: "Inter, sans-serif", // Body/Font family
                      fontWeight: 400,
                      fontSize: "1rem", // Scale 02 (usually 16px, adjust if needed)
                      lineHeight: "20px",
                      letterSpacing: 0,
                      textAlign: "center",
                      color: dashboardColor || "#222", // Use dashboard color for subtitle
                      mt: "4px"
                    }}
                  >
                    {title}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box flexGrow={1} width="100%" height="100%" >
                {showTable ? (
                  Array.isArray(data) && data.length > 0 && data[0].x && data[0].y ? (
                    <Box sx={{
                      overflowX: 'auto',
                      width: '100%',
                      height: size.height - 100, // leave a little padding
                      maxHeight: 'calc(size.height - 100px)', // leave a little padding
                      p: 2,
                      m: 0,
                    }}>
                      <table style={{ minWidth: '100%', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', background: 'transparent' }}>
                       <thead>
                          <tr style={{ background: dashboardColor ? `${dashboardColor}22` : '#e9efff' }}>
                            {headers && headers.length > 0 ? (
                              headers.map((h, idx) => (
                                <th key={h + idx} style={{ border: "1px solid #ccc", padding: 6, textAlign: 'left', fontWeight: 600 }}>{h}</th>
                              ))
                            ) : (
                              <>
                                <th style={{ border: "1px solid #ccc", padding: 6, textAlign: 'left', fontWeight: 600 }}>X</th>
                                <th style={{ border: "1px solid #ccc", padding: 6, textAlign: 'left', fontWeight: 600 }}>Y</th>
                              </>
                            )}
                          </tr> 
                          </thead>
                        <tbody>
                          {data[0].x.map((xVal: any, idx: number) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : (dashboardColor ? `${dashboardColor}22` : '#e9efff') }}>
                            
                                  <td style={{ border: "1px solid #ccc", padding: 6, wordBreak: 'break-word', maxWidth: 200, textOverflow: 'ellipsis' }}>{xVal}</td>
                                  <td style={{ border: "1px solid #ccc", padding: 6, wordBreak: 'break-word', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data[0].y[idx]}</td>
                               </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  ) : (
                    <div>No tabular data available.</div>
                  )
                ) : (
                  <Plot
                    data={Array.isArray(plotData) ? plotData.map(trace => {
                      let patched = {
                        ...trace,
                        marker: {
                          ...trace.marker,
                          color: dashboardColor || TITLE_COLOR,
                          line: {
                            ...trace.marker?.line,
                            color: dashboardColor || TITLE_COLOR
                          }
                        },
                        line: trace.line ? {
                          ...trace.line,
                          color: dashboardColor || TITLE_COLOR
                        } : undefined,
                        text: (trace.y && Array.isArray(trace.y)) ? trace.y : undefined,
                        textfont: { color: '#222', size: 13, family: 'Inter, sans-serif' },
                      };
                      // For line charts, ensure mode includes 'text' and set textposition
                      if (type === 'line' && patched.type === 'scatter') {
                        patched.mode = (patched.mode || 'lines+markers') + '+text';
                        patched.textposition = 'top center';
                      } else if (type === 'bar' || type === 'scatter') {
                        patched.textposition = 'auto';
                      } else if (type === 'pie' && patched.type === 'pie') {
                        patched.textinfo = 'label+percent+value';
                        patched.textposition = 'inside';
                        patched.textfont = { color: '#222', size: 14, family: 'Inter, sans-serif' };
                      }
                      return patched;
                    }) : plotData}
                    layout={{
                      ...layout,
                      autosize: true,
                      margin: plotMargin,
                      width: size.width - 30,
                      height: size.height - 110,
                      font: { color: dashboardColor || TITLE_COLOR, family: "Inter, sans-serif" },
                      legend: {
                        orientation: "h",
                        x: 0.5,
                        y: -0.2,
                        xanchor: "center",
                        font: { color: dashboardColor || TITLE_COLOR, size: 13 },
                        visible: false
                      }
                    }}
                    useResizeHandler
                    style={{ width: "100%", height: "100%" }}
                    config={{
                      responsive: true,
                      displayModeBar: true, // Enable the mode bar
                      modeBarButtonsToRemove: [
                        "select2d",
                        "lasso2d",
                        "autoScale2d",
                        "resetScale2d",
                        "toggleSpikelines",
                        "hoverClosestCartesian",
                        "hoverCompareCartesian"
                      ],
                      scrollZoom: true // Enable zoom with mouse wheel
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Rnd>
      {/* Snackbar at center of the page */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          left: "50%",
          transform: "translateX(-50%)",
          top: "40vh"
        }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          severity="warning"
          sx={{ width: '100%' }}
        >
          {resizeWarning}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Card;
