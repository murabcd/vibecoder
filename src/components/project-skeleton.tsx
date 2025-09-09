import { Skeleton } from "@/components/ui/skeleton";

export function ProjectSkeleton() {
	return (
		<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
			{/* Title */}
			<Skeleton className="h-6 w-3/4 mb-2" />

			{/* Description */}
			<Skeleton className="h-4 w-full mb-1" />
			<Skeleton className="h-4 w-2/3 mb-4" />

			{/* Tags/Files */}
			<div className="flex gap-2 mb-4">
				<Skeleton className="h-5 w-16" />
				<Skeleton className="h-5 w-20" />
				<Skeleton className="h-5 w-14" />
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-24" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
			</div>
		</div>
	);
}

export function ProjectSkeletonGrid({ count = 6 }: { count?: number }) {
	const skeletons = Array.from({ length: count }, () => crypto.randomUUID());

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{skeletons.map((id) => (
				<ProjectSkeleton key={id} />
			))}
		</div>
	);
}
