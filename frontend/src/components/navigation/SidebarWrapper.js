import React from 'react';
import Sidebar from './Sidebar';
import './SidebarWrapper.css';

const SidebarWrapper = ({ children }) => {
  return (
    <div className="sidebar-wrapper">
      {children}
      <Sidebar />
    </div>
  );
};

export default SidebarWrapper;
