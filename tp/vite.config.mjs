import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main:      resolve(__dirname, 'index.html'),
				bridge:    resolve(__dirname, 'bridge.html'),
				rails:     resolve(__dirname, 'rails.html'),
				scene:     resolve(__dirname, 'scene.html'),
				terrain:   resolve(__dirname, 'terrain.html'),
				trackMap: resolve(__dirname, 'track-map.html'),
				train:     resolve(__dirname, 'train.html'),
				trees:     resolve(__dirname, 'trees.html'),
				tunnel:    resolve(__dirname, 'tunnel.html')
			},
		},
	},
	base: "./",
})
