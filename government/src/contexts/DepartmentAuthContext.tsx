import { createContext, useContext, useState, ReactNode } from "react";

const DEPT_PATHS = [
  "/environmental",
  "/water-resources",
  "/industrial-regulation",
  "/administration",
  "/agricultural",
  "/waste",
  "/forest",
  "/healthcare",
  "/soil-conservation",
];

const buildDefaultPasswords = () =>
  Object.fromEntries(DEPT_PATHS.map((p) => [p, "admin"]));

interface DepartmentAuthContextType {
  unlockedDepts: Set<string>;
  unlockDept: (path: string) => void;
  isDeptUnlocked: (path: string) => boolean;
  changePassword: (path: string, newPassword: string) => void;
  getPassword: (path: string) => string;
}

const DepartmentAuthContext = createContext<DepartmentAuthContextType | null>(null);

export function DepartmentAuthProvider({ children }: { children: ReactNode }) {
  const [unlockedDepts, setUnlockedDepts] = useState<Set<string>>(new Set());
  const [passwords, setPasswords] = useState<Record<string, string>>(buildDefaultPasswords());

  const unlockDept = (path: string) => {
    setUnlockedDepts(prev => new Set([...prev, path]));
  };

  const isDeptUnlocked = (path: string) => unlockedDepts.has(path);

  const changePassword = (path: string, newPassword: string) => {
    setPasswords(prev => ({ ...prev, [path]: newPassword }));
    // Lock the dept again so the new password is required on next visit
    setUnlockedDepts(prev => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  };

  const getPassword = (path: string) => passwords[path] ?? "";

  return (
    <DepartmentAuthContext.Provider value={{ unlockedDepts, unlockDept, isDeptUnlocked, changePassword, getPassword }}>
      {children}
    </DepartmentAuthContext.Provider>
  );
}

export function useDepartmentAuth() {
  const ctx = useContext(DepartmentAuthContext);
  if (!ctx) throw new Error("useDepartmentAuth must be used within DepartmentAuthProvider");
  return ctx;
}
