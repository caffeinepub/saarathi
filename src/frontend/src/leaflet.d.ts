// Minimal type shim for leaflet loaded via CDN / dynamic import
declare module "leaflet" {
  const L: any;
  export = L;
}
