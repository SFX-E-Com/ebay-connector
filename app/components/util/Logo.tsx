'use client';

import React from "react";
import { Button } from "react-bootstrap";
import { AiFillThunderbolt, AiOutlineSearch } from "react-icons/ai";

export const Logo = () => (
  <div className="d-flex w-100 align-items-center justify-content-between gap-4">
    <div className="d-flex align-items-center gap-2">
      <AiFillThunderbolt size={30} className="text-primary" />
      <span className="fw-bold" style={{ fontSize: '16px' }}>
        eBay Connector
      </span>
    </div>
    <Button
      variant="link"
      aria-label="search"
      className="text-dark p-2"
      style={{ fontSize: '24px' }}
    >
      <AiOutlineSearch />
    </Button>
  </div>
);