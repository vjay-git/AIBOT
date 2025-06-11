import React from "react";
import { Box, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface DashboardSidebarProps {
  dashboardKeys: string[];
  dashboards: any;
  selectedDashboard: string;
  setSelectedDashboard: (id: string) => void;
  onAddDashboard: () => void;
  onEditDashboard: (id: string) => void; // New prop
  // Optionally add handlers for bookmark and delete if needed
  onBookmarkDashboard?: (id: string) => void;
  onDeleteDashboard?: (id: string) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  dashboardKeys,
  dashboards,
  selectedDashboard,
  setSelectedDashboard,
  onAddDashboard,
  onEditDashboard,
  onBookmarkDashboard,
  onDeleteDashboard,
}) => (
  <Box 
    sx={{
      ml:'-3rem'
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} ml={8}>
      <span style={{ fontWeight: 700, color: "#1a237e", fontSize: 18 }}>Dashboard</span>
      <Button
        size="small"
        sx={{ minWidth: 0, p: 0, color: "#1a237e", fontSize: 22, fontWeight: 700 }}
        onClick={onAddDashboard}
      >
        +
      </Button>
    </Box>
    <Box ml={8}>
      {dashboardKeys.map((dashboardId) => {
        const dashboard = dashboards[dashboardId];
        const title = dashboard?.description?.dashboard_title || dashboardId;
        return (
          <Box
            key={dashboardId}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1.5,
              py: 1,
              mb: 0.5,
              borderRadius: 2,
              cursor: "pointer",
              background: selectedDashboard === dashboardId ? "#e8edfa" : "transparent",
              color: selectedDashboard === dashboardId ? "#1a237e" : "#222",
              fontWeight: selectedDashboard === dashboardId ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "background 0.2s",
              '&:hover': {
                background: "#e8edfa",
              },
            }}
          >
            <Box flex={1} onClick={() => setSelectedDashboard(dashboardId)}>
              {title}
            </Box>
            <IconButton
              size="small"
              sx={{ ml: 1, color: '#888' }}
              onClick={e => {
                e.stopPropagation();
                onEditDashboard(dashboardId);
              }}
              aria-label="Edit dashboard"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ ml: 1, color: '#888' }}
              onClick={e => {
                e.stopPropagation();
                onBookmarkDashboard && onBookmarkDashboard(dashboardId);
              }}
              aria-label="Bookmark dashboard"
            >
              <BookmarkBorderIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ ml: 1, color: '#888' }}
              onClick={e => {
                e.stopPropagation();
                onDeleteDashboard && onDeleteDashboard(dashboardId);
              }}
              aria-label="Delete dashboard"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}
    </Box>
  </Box>
);

export default DashboardSidebar;