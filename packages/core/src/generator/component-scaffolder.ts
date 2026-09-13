export interface ScaffoldComponentOptions {
  name: string;
  category?: "card" | "button" | "badge" | "modal" | "stat" | "input" | "section" | "other";
  description?: string;
  hasVariants?: boolean;
}

export interface GeneratedComponentFile {
  componentName: string;
  suggestedFilePath: string;
  code: string;
}

export function scaffoldComponent(options: ScaffoldComponentOptions): GeneratedComponentFile {
  const { name, category = "card", hasVariants = true } = options;
  const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
  const kebabName = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

  let code = `import * as React from "react";\n\n`;

  if (category === "card") {
    code += `export interface ${pascalName}Props extends React.HTMLAttributes<HTMLDivElement> {\n`;
    code += `  title?: string;\n`;
    code += `  description?: string;\n`;
    code += `  variant?: "default" | "bordered" | "elevated";\n`;
    code += `  children?: React.ReactNode;\n`;
    code += `}\n\n`;

    code += `export function ${pascalName}({\n`;
    code += `  title,\n`;
    code += `  description,\n`;
    code += `  variant = "default",\n`;
    code += `  children,\n`;
    code += `  className = "",\n`;
    code += `  ...props\n`;
    code += `}: ${pascalName}Props) {\n`;
    code += `  const variantStyles = {\n`;
    code += `    default: "bg-card text-card-foreground border rounded-xl p-6 shadow-sm",\n`;
    code += `    bordered: "bg-transparent border-2 border-border rounded-xl p-6",\n`;
    code += `    elevated: "bg-card text-card-foreground rounded-xl p-6 shadow-md border",\n`;
    code += `  };\n\n`;
    code += `  return (\n`;
    code += `    <div className={\`\${variantStyles[variant]} \${className}\`} {...props}>\n`;
    code += `      {title && <h3 className="font-semibold text-lg tracking-tight mb-1">{title}</h3>}\n`;
    code += `      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}\n`;
    code += `      {children}\n`;
    code += `    </div>\n`;
    code += `  );\n`;
    code += `}\n\n`;
    code += `export default ${pascalName};\n`;
  } else if (category === "badge") {
    code += `export interface ${pascalName}Props extends React.HTMLAttributes<HTMLSpanElement> {\n`;
    code += `  variant?: "default" | "secondary" | "outline" | "destructive";\n`;
    code += `  children: React.ReactNode;\n`;
    code += `}\n\n`;

    code += `export function ${pascalName}({\n`;
    code += `  variant = "default",\n`;
    code += `  children,\n`;
    code += `  className = "",\n`;
    code += `  ...props\n`;
    code += `}: ${pascalName}Props) {\n`;
    code += `  const variantStyles = {\n`;
    code += `    default: "bg-primary text-primary-foreground hover:bg-primary/80",\n`;
    code += `    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",\n`;
    code += `    outline: "text-foreground border border-input hover:bg-accent",\n`;
    code += `    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",\n`;
    code += `  };\n\n`;
    code += `  return (\n`;
    code += `    <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors \${variantStyles[variant]} \${className}\`} {...props}>\n`;
    code += `      {children}\n`;
    code += `    </span>\n`;
    code += `  );\n`;
    code += `}\n`;
  } else if (category === "stat") {
    code += `export interface ${pascalName}Props {\n`;
    code += `  label: string;\n`;
    code += `  value: string | number;\n`;
    code += `  change?: string;\n`;
    code += `  isPositive?: boolean;\n`;
    code += `  className?: string;\n`;
    code += `}\n\n`;

    code += `export function ${pascalName}({\n`;
    code += `  label,\n`;
    code += `  value,\n`;
    code += `  change,\n`;
    code += `  isPositive,\n`;
    code += `  className = "",\n`;
    code += `}: ${pascalName}Props) {\n`;
    code += `  return (\n`;
    code += `    <div className={\`p-6 rounded-xl border bg-card text-card-foreground shadow-sm \${className}\`}>\n`;
    code += `      <p className="text-sm font-medium text-muted-foreground">{label}</p>\n`;
    code += `      <div className="flex items-baseline justify-between mt-2">\n`;
    code += `        <h4 className="text-2xl font-bold tracking-tight">{value}</h4>\n`;
    code += `        {change && (\n`;
    code += `          <span className={\`text-xs font-semibold \${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}\`}>\n`;
    code += `            {change}\n`;
    code += `          </span>\n`;
    code += `        )}\n`;
    code += `      </div>\n`;
    code += `    </div>\n`;
    code += `  );\n`;
    code += `}\n`;
  } else {
    code += `export interface ${pascalName}Props extends React.HTMLAttributes<HTMLDivElement> {\n`;
    code += `  children?: React.ReactNode;\n`;
    code += `}\n\n`;

    code += `export function ${pascalName}({\n`;
    code += `  children,\n`;
    code += `  className = "",\n`;
    code += `  ...props\n`;
    code += `}: ${pascalName}Props) {\n`;
    code += `  return (\n`;
    code += `    <div className={\`w-full \${className}\`} {...props}>\n`;
    code += `      {children}\n`;
    code += `    </div>\n`;
    code += `  );\n`;
    code += `}\n`;
  }

  return {
    componentName: pascalName,
    suggestedFilePath: `components/${kebabName}.tsx`,
    code,
  };
}
