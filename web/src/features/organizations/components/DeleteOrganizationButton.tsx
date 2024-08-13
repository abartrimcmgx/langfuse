import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { api } from "@/src/utils/api";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useQueryOrganization } from "@/src/features/organizations/hooks";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast"; // Import success toast function

export function DeleteOrganizationButton() {
  const capture = usePostHogClientCapture();

  const organization = useQueryOrganization();
  const confirmMessage =
    organization?.name.replaceAll(" ", "-").toLowerCase() ?? "organization";

  const formSchema = z.object({
    name: z.string().includes(confirmMessage, {
      message: `Please confirm with "${confirmMessage}"`,
    }),
  });

  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:delete",
  });

  const deleteOrganization = api.organizations.delete.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async () => {
    if (!organization) return;
    try {
      await deleteOrganization.mutateAsync({
        orgId: organization.id,
      });
      capture("organization_settings:delete_organization");
      showSuccessToast({
        title: "Organization Deleted",
        description: "The organization has been successfully deleted.",
      });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Delay for 5 seconds
      window.location.href = "/"; // Browser reload to refresh jwt
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive-secondary" disabled={!hasAccess}>
          Delete Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            {`To confirm, type "${confirmMessage}" in the input box `}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder={confirmMessage} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="destructive"
              loading={deleteOrganization.isLoading}
              className="w-full"
            >
              Delete Organization
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}