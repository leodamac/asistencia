import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import MensajeDeCarga from "./components/MensajeDeCarga/MensajeDeCarga";

const modules = import.meta.glob("./pages/**/[A-Za-z]*.tsx");

const autoRoutes = Object.keys(modules).map((path) => {
  const name = path.match(/\.\/pages\/(.+)\/[A-Za-z]*.tsx/)?.[1] || "";
  const Component = lazy(modules[path] as any);
  
  return {
    path: `/${name.toLowerCase()}`,
    element: Component,
  };
});

const manualRoutes = [
  { path: "*", element: lazy(() => import("./pages/Login/Login")) },
  { path: "/crear-usaurios", element: lazy(() => import("./components/CrearUsuarios/crearUsuarios")) },
];

const routes = [...autoRoutes, ...manualRoutes];

export const AppRoutes = () => {
  return (
    <Suspense fallback={<div><MensajeDeCarga mensaje="Cargando rutas..."/></div>}>
      {useRoutes(
        routes.map(({ path, element: Component }) => ({
          path,
          element: Component ? <Component /> : null,
        }))
      )}
  </Suspense>
  );
};
