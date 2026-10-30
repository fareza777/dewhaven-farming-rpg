import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,fullyParallel:false,workers:1,
  use:{baseURL:'http://localhost:5176',headless:true,channel:'chrome',viewport:{width:1440,height:900},screenshot:'only-on-failure'},
  reporter:'list',webServer:{command:'npm run dev',url:'http://localhost:5176',reuseExistingServer:true,timeout:30000},
});
