import React from 'react';
import { Navigate } from 'react-router-dom';

const StudentTrackingView = () => {
  return <Navigate to="/student/live-tracking" replace />;
};

export default StudentTrackingView;