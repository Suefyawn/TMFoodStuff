import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Orders } from './collections/Orders'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'customers',
    bundler: webpackBundler(),
  },
  editor: slateEditor({}),
  collections: [Products, Categories, Orders, Customers, Media],
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  typescript: {
    outputFile: './src/types/payload-types.ts',
  },
})
