import { Command } from 'commander';

const program = new Command();

program
  .name("ui-keeper")
  .description("UI Keeper CLI");

program
  .command("create")
  .description("Create a new UI")
  .action(() => {
    console.log("Creating a new UI");
  });

program.parse(process.argv);
