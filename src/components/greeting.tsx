import { Link } from "@tanstack/react-router";

import { motion } from "framer-motion";

export default function Greeting() {
	return (
		<div
			key="overview"
			className="max-w-3xl mx-auto md:mt-20 px-2 size-full flex flex-col justify-center"
		>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.5 }}
				className="text-2xl font-semibold"
			>
				Hey there!
			</motion.div>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.6 }}
				className="text-2xl text-zinc-500"
			>
				How can I vibe with you?
			</motion.div>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.7 }}
				className="mt-4"
			>
				<p className="text-sm text-muted-foreground">
					Vibe code with voice. If you like it, contribute or star on{" "}
					<Link
						className="underline underline-offset-4"
						href="https://github.com/murabcd/vibecoder"
						target="_blank"
					>
						GitHub
					</Link>
					.
				</p>
			</motion.div>
		</div>
	);
}
