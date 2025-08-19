"use client";

import { type FormEventHandler, useEffect, useState } from "react";

import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogFooter,
} from "@/components/ui/dialog";

import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface RenameModalProps {
	isOpen: boolean;
	onClose: () => void;
	id: Id<"histories">;
	title: string;
}

export const RenameModal = ({
	isOpen,
	onClose,
	id,
	title,
}: RenameModalProps) => {
	const updateAppTitle = useMutation(api.histories.updateTitle);

	const [newTitle, setNewTitle] = useState(title);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		setNewTitle(title);
	}, [title]);

	const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

		setPending(true);
		try {
			await updateAppTitle({
				id,
				title: newTitle,
			});
			toast.success("Project renamed");
			onClose();
		} catch (error) {
			toast.error("Failed to rename project");
		} finally {
			setPending(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename project</DialogTitle>
					<DialogDescription>
						Enter a new project name. Click save when you&apos;re done.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<Input
						id="form-title"
						name="form-title"
						disabled={pending}
						required
						maxLength={60}
						value={newTitle}
						onChange={(event) => setNewTitle(event.target.value)}
						placeholder="Form title"
					/>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="ghost">
								Cancel
							</Button>
						</DialogClose>
						<Button disabled={pending} type="submit">
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
