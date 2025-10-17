import React from "react";

const DocumentationPage: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Documentation</h1>
      <p>
        Welcome to the documentation page. More content will be added here soon.
      </p>
      <section>
        <h2>Getting Started</h2>
        <p>Instructions on how to install and use the `captions.js` library.</p>
      </section>
      <section>
        <h2>API Reference</h2>
        <p>Detailed documentation for the public API will be available here.</p>
      </section>
    </div>
  );
};

export default DocumentationPage;
