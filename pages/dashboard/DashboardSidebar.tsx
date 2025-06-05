import React from "react";
import { Box, Button } from "@mui/material";

interface DashboardSidebarProps {
  dashboardKeys: string[];
  dashboards: any;
  selectedDashboard: string;
  setSelectedDashboard: (id: string) => void;
  onAddDashboard: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  dashboardKeys,
  dashboards,
  selectedDashboard,
  setSelectedDashboard,
  onAddDashboard,
}) => (
  <Box
    sx={{
      width: 280,
      bgcolor: "#fff",
      borderRight: "1px solid #e0e0e0",
      p: 2,
      minHeight: "100vh",
      
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
              "&:hover": {
                background: "#e8edfa",
              },
            }}
            onClick={() => setSelectedDashboard(dashboardId)}
          >
            {title}
          </Box>
        );
      })}
    </Box>
  </Box>
);

export default DashboardSidebar;