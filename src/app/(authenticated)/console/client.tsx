"use client";

import { useAuth } from "@/app/_auth";
import React from "react";

const Client = () => {
  const { user } = useAuth();
  return <div>Client {user?.username}</div>;
};

export default Client;
