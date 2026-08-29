import { resetDemoData } from './reset'

export default async function globalSetup() {
  await resetDemoData()
}
