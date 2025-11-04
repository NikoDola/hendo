declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    vfs: Record<string, string>;
    createPdf: (docDefinition: unknown) => {
      getBlob: (callback: (blob: Blob) => void) => void;
      getBuffer: (callback: (buffer: Buffer) => void) => void;
    };
  };
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfMake: {
    vfs: Record<string, string>;
  };
  export default pdfMake;
}

