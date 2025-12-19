<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Vinyl;
use App\Service\Router;
use App\Service\Templating;

class VinylController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $vinyls = Vinyl::findAll();
        $html = $templating->render('vinyl/index.html.php', [
            'vinyls' => $vinyls,
            'router' => $router,
        ]);
        return $html;
    }

    public function createAction(?array $requestVinyl, Templating $templating, Router $router): ?string
    {
        if ($requestVinyl) {
            $vinyl = Vinyl::fromArray($requestVinyl);
            $vinyl->save();

            $path = $router->generatePath('vinyl-index');
            $router->redirect($path);
            return null;
        } else {
            $vinyl = new Vinyl();
        }

        $html = $templating->render('vinyl/create.html.php', [
            'vinyl' => $vinyl,
            'router' => $router,
        ]);
        return $html;
    }

    public function editAction(int $vinylId, ?array $requestVinyl, Templating $templating, Router $router): ?string
    {
        $vinyl = Vinyl::find($vinylId);
        if (! $vinyl) {
            throw new NotFoundException("Missing vinyl with id $vinylId");
        }

        if ($requestVinyl) {
            $vinyl->fill($requestVinyl);
            // @todo missing validation
            $vinyl->save();

            $path = $router->generatePath('vinyl-index');
            $router->redirect($path);
            return null;
        }

        $html = $templating->render('vinyl/edit.html.php', [
            'vinyl' => $vinyl,
            'router' => $router,
        ]);
        return $html;
    }

    public function showAction(int $vinylId, Templating $templating, Router $router): ?string
    {
        $vinyl = Vinyl::find($vinylId);
        if (! $vinyl) {
            throw new NotFoundException("Missing vinyl with id $vinylId");
        }

        $html = $templating->render('vinyl/show.html.php', [
            'vinyl' => $vinyl,
            'router' => $router,
        ]);
        return $html;
    }

    public function deleteAction(int $vinylId, Router $router): ?string
    {
        $vinyl = Vinyl::find($vinylId);
        if (! $vinyl) {
            throw new NotFoundException("Missing vinyl with id $vinylId");
        }

        $vinyl->delete();
        $path = $router->generatePath('vinyl-index');
        $router->redirect($path);
        return null;
    }
}
