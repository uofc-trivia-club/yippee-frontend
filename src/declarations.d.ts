declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Add missing type declarations for third-party packages
declare module 'react-xarrows';
declare module '@dnd-kit/sortable';
declare module '@dnd-kit/utilities';
