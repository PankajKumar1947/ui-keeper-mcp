#!/usr/bin/env bun
import { Command } from "commander";
import * as path from "node:path";
import pc from "picocolors";
import { analyzeProject, auditProject } from "@ui-keeper/core";

const program = new Command();

program
  .name("ui-keeper")
  .description("UI Keeper — The Frontend Quality & Verification Agent")
  .version("0.1.0");

// Command: init
program
  .command("init [path]")
  .description("Initialize UI Keeper on a project and generate baseline model")
  .action((targetPath = ".") => {
    const rootDir = path.resolve(targetPath);
    console.log(pc.cyan(`\n🔍 Initializing UI Keeper in ${rootDir}...\n`));
    const model = analyzeProject({ rootDir });

    console.log(pc.green("✔ Project analyzed successfully!"));
    console.log(`  Framework:      ${pc.bold(model.config.framework)}`);
    console.log(`  Styling:        ${pc.bold(model.config.stylingEngine)}`);
    console.log(`  Components:     ${pc.bold(model.componentCatalog.totalCount.toString())}`);
    console.log(`  Routes:         ${pc.bold(model.routes.length.toString())}`);
    console.log(`  Design Tokens:  ${pc.bold(model.designSystem.colors.length.toString())} colors, ${pc.bold(model.designSystem.spacing.length.toString())} spacing values\n`);
  });

// Command: analyze
program
  .command("analyze [path]")
  .description("Extract the project's design system, component catalog, and routes")
  .action((targetPath = ".") => {
    const rootDir = path.resolve(targetPath);
    console.log(pc.cyan(`\n🔬 Analyzing UI system in: ${rootDir}\n`));
    const model = analyzeProject({ rootDir });

    console.log(pc.bold(pc.underline("Detected UI System:")));
    console.log(`  Framework:       ${pc.magenta(model.config.framework)}`);
    console.log(`  Styling Engine:  ${pc.magenta(model.config.stylingEngine)}`);
    console.log(`  Colors:          ${pc.yellow(model.designSystem.colors.length.toString())}`);
    console.log(`  Spacing Scale:   ${pc.yellow(model.designSystem.spacing.length.toString())}`);
    console.log(`  Typography:      ${pc.yellow(model.designSystem.typography.length.toString())}`);
    console.log(`  Radius Tokens:   ${pc.yellow(model.designSystem.radius.length.toString())}`);
    console.log(`  Breakpoints:     ${pc.yellow(model.designSystem.breakpoints.length.toString())}`);
    console.log(`  Components:      ${pc.yellow(model.componentCatalog.totalCount.toString())}`);
    console.log(`  Routes:          ${pc.yellow(model.routes.length.toString())}\n`);

    if (model.componentCatalog.totalCount > 0) {
      console.log(pc.bold(pc.underline("Component Catalog:")));
      for (const comp of model.componentCatalog.components.slice(0, 15)) {
        console.log(`  • ${pc.bold(comp.name.padEnd(20))} ${pc.dim(`[${comp.category}]`)} (${comp.props.length} props) → ${pc.dim(comp.filePath)}`);
      }
      if (model.componentCatalog.totalCount > 15) {
        console.log(pc.dim(`  ... and ${model.componentCatalog.totalCount - 15} more components`));
      }
      console.log();
    }

    if (model.routes.length > 0) {
      console.log(pc.bold(pc.underline("Routes:")));
      for (const route of model.routes.slice(0, 10)) {
        console.log(`  • ${pc.cyan(route.path.padEnd(25))} ${pc.dim(route.filePath)}`);
      }
      if (model.routes.length > 10) {
        console.log(pc.dim(`  ... and ${model.routes.length - 10} more routes`));
      }
      console.log();
    }
  });

// Command: audit
program
  .command("audit [path]")
  .description("Find static UI, design-system drift, and duplication problems")
  .option("-t, --target <path>", "Specific file or directory to audit")
  .action((targetPath = ".", options) => {
    const rootDir = path.resolve(targetPath);
    console.log(pc.cyan(`\n🔎 Auditing UI quality in: ${rootDir}\n`));

    const report = auditProject({
      rootDir,
      targetPath: options.target,
    });

    if (report.totalIssues === 0) {
      console.log(pc.green("✨ Clean UI! No design system drift or component issues detected.\n"));
      return;
    }

    for (const issue of report.issues) {
      const isError = issue.severity === "error";
      const badge = isError ? pc.red("✖ ERROR") : pc.yellow("⚠ WARN ");
      const location = `${issue.location.filePath}:${issue.location.line}:${issue.location.column}`;

      console.log(`${badge} ${pc.bold(issue.message)}`);
      console.log(`  ${pc.dim("at")} ${pc.underline(location)} ${pc.dim(`[${issue.ruleId}]`)}`);
      if (issue.snippet) {
        console.log(`  ${pc.dim("snippet:")} ${pc.italic(issue.snippet)}`);
      }
      if (issue.suggestedFix) {
        console.log(`  ${pc.green("💡 fix:")} ${issue.suggestedFix.description}`);
      }
      console.log();
    }

    console.log(pc.bold(pc.underline("Audit Summary:")));
    console.log(`  Total Issues:  ${pc.bold(report.totalIssues.toString())}`);
    console.log(`  Errors:        ${pc.red(report.errorsCount.toString())}`);
    console.log(`  Warnings:      ${pc.yellow(report.warningsCount.toString())}\n`);

    if (report.errorsCount > 0) {
      process.exitCode = 1;
    }
  });

// Command: inspect
program
  .command("inspect [path]")
  .description("Output full JSON model for AI agents or tooling")
  .action((targetPath = ".") => {
    const rootDir = path.resolve(targetPath);
    const model = analyzeProject({ rootDir });
    console.log(JSON.stringify(model, null, 2));
  });

program.parse(process.argv);
