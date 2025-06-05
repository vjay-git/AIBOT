// components/Card.tsx
import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { Rnd, RndResizeCallback } from "react-rnd";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export type ChartType = "bar" | "line" | "pie" | "scatter" | "text" | "table" | "tabular";

interface CardProps {
    id: string;
    type: ChartType;
    title?: string;
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
}

const Card: React.FC<CardProps> = ({
  id, type, title, data, layout, onDelete, onEdit, position, onDragStop, isPinned, onPin, onUnpin, disableDragging, disableResizing, chartTypeDropdown
}) => {
  const [size, setSize] = useState({ width: 400, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize: RndResizeCallback = (_e, _dir, ref) => {
    setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
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
      : { l: 24, r: 5, t: 5, b: 36 };

  // Convert data to correct graph type if needed
  let plotData = data;

  if (
    Array.isArray(data) &&
    data.length === 1 &&
    typeof data[0] === "object" &&
    Array.isArray(data[0].x) &&
    Array.isArray(data[0].y)
  ) {
    if (isBarLike) {
      plotData = [{ ...data[0], type: "bar" }];
    } else if (type === "line") {
      plotData = [{ ...data[0], type: "scatter", mode: "lines+markers" }];
    } else if (type === "scatter") {
      plotData = [{ ...data[0], type: "scatter", mode: "markers" }];
    } else if (type === "pie") {
      plotData = [
        {
          type: "pie",
          labels: data[0].x,
          values: data[0].y,
          ...(data[0].marker ? { marker: data[0].marker } : {}),
        },
      ];
    }
  }

  // --- Title ellipsis and tooltip ---
  // Show ellipsis if title is too long for the card width, show full title on hover as tooltip
  const titleStyle = {
    maxWidth: size.width - 80, // leave space for buttons
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
    verticalAlign: "middle",
    cursor: "pointer"
  };

  return (
    <Rnd
      default={{
        x: position?.x || 20,
        y: position?.y || 20,
        width: size.width,
        height: size.height
      }}
      position={position}
      size={size}
      onResize={onResize}
      onResizeStop={(_e, _dir, ref, _delta, positionObj) => {
        if (onDragStop) {
          onDragStop(
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
        elevation={3}
        sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        ref={containerRef}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={1}
          borderBottom="1px solid #ddd"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              textTransform="capitalize"
              sx={titleStyle}
              title={title}
            >
              {title}
            </Typography>
            {/* Render chartTypeDropdown if provided */}
            {chartTypeDropdown}
          </Box>
          <Box>
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
        <Box flexGrow={1} display="flex" flexDirection="column">
          {type === "text" ? (
            <Box p={2} flexGrow={1} display="flex" alignItems="center" justifyContent="center">
              <Typography variant="body1" textAlign="center">
                {data}
              </Typography>
            </Box>
          ) : (
            <Box flexGrow={1} width="100%" height="100%">
              <Plot
                data={plotData}
                layout={{
                  ...layout,
                  autosize: true,
                  margin: plotMargin,
                  width: size.width,
                  height: size.height - 48
                }}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true }}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Rnd>
  );
};

export default Card;
